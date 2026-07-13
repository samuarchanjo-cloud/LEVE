import {createClient} from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'
import {messages,type Period} from '../_shared/messages.ts'
import {selectDailyMessage} from '../_shared/daily-selector.ts'
import {canDeliverNotification,isWelcomeNotification} from '../_shared/delivery-window.mjs'
import {dailyNotificationId,isWithinMomentWindow,saoPauloDate,scheduledAt} from '../_shared/daily-schedule.mjs'

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET=Deno.env.get('CRON_SECRET')!
const VAPID_PUBLIC_KEY=Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY=Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT=Deno.env.get('VAPID_SUBJECT')||'mailto:suporte@metodoleve.app'
const PERIODS:Period[]=['morning','afternoon','night']
webpush.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY)

function previousDate(date:string,days=1){const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-days);return d.toISOString().slice(0,10)}
function calculateStreak(rows:{entry_date:string}[],date:string){
 const dates=new Set(rows.map(r=>r.entry_date)),start=dates.has(date)?date:previousDate(date)
 let streak=0,current=start
 while(dates.has(current)){streak++;current=previousDate(current)}
 return streak
}

async function ensureDailyMoments(db:any,now:Date){
 const date=saoPauloDate(now)
 const{data:subscriptions,error:subscriptionError}=await db.from('push_subscriptions').select('user_id').not('push_subscription_validated_at','is',null)
 if(subscriptionError)throw subscriptionError
 const userIds=[...new Set((subscriptions||[]).map((s:{user_id:string})=>s.user_id))] as string[]
 if(!userIds.length)return 0
 const{data:profiles,error:profileError}=await db.from('profiles').select('id').in('id',userIds).eq('notification_permission','granted')
 if(profileError)throw profileError
 const eligibleIds=(profiles||[]).map((p:{id:string})=>p.id)
 if(!eligibleIds.length)return 0
 const{data:existing}=await db.from('notification_history').select('user_id,notification_id').in('user_id',eligibleIds).eq('schedule_date',date)
 const keys=new Set((existing||[]).map((j:{user_id:string;notification_id:string})=>`${j.user_id}:${j.notification_id}`))
 let created=0
 for(const userId of eligibleIds)for(const period of PERIODS){
  const notificationId=dailyNotificationId(period,date),key=`${userId}:${notificationId}`
  if(keys.has(key))continue
  const{error}=await db.from('notification_history').insert({user_id:userId,notification_id:notificationId,category:'daily',period,schedule_date:date,scheduled_at:scheduledAt(userId,date,period).toISOString(),target_url:'/app',choice_reason:'awaiting-daily-context'})
  if(!error){keys.add(key);created++}
  else if(error.code!=='23505')throw error
 }
 return created
}

async function loadDailyState(db:any,job:any){
 const date=job.schedule_date as string
 const[{data:entry},{data:profile},{data:entries}]=await Promise.all([
  db.from('diario_entries').select('agua,alimentacao_consciente,movimento,sono_regular,gentileza,nota_do_dia').eq('user_id',job.user_id).eq('entry_date',date).maybeSingle(),
  db.from('profiles').select('onboarding_completed_at').eq('id',job.user_id).single(),
  db.from('diario_entries').select('entry_date').eq('user_id',job.user_id).lte('entry_date',date).order('entry_date',{ascending:false}).limit(30),
 ])
 const started=profile?.onboarding_completed_at?new Date(profile.onboarding_completed_at).getTime():Date.now()
 const currentDay=Math.min(21,Math.max(1,Math.floor((Date.now()-started)/86400000)+1))
 const{data:exercise}=await db.from('exercise_completions').select('exercise_day').eq('user_id',job.user_id).eq('exercise_day',currentDay).maybeSingle()
 const habits=['agua','alimentacao_consciente','movimento','sono_regular','gentileza']
 return{water:!!entry?.agua,food:!!entry?.alimentacao_consciente,movement:!!entry?.movimento||!!exercise,journal:!!entry?.nota_do_dia?.trim(),habitsCompleted:habits.filter(k=>entry?.[k]).length,streak:calculateStreak(entries||[],date),recipeId:''}
}

Deno.serve(async req=>{
 if(req.headers.get('authorization')!==`Bearer ${CRON_SECRET}`)return new Response('Unauthorized',{status:401})
 let testInput:any={}
 try{testInput=await req.clone().json()}catch{}
 const testEnabled=Deno.env.get('ENABLE_NOTIFICATION_TEST_MODE')==='true'
 const testMode=testEnabled&&!!testInput.testNow
 const now=testMode?new Date(testInput.testNow):new Date()
 const db=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false}})
 let scheduled=0,scheduleError:string|null=null
 try{scheduled=await ensureDailyMoments(db,now)}catch{scheduleError='daily_schedule_failed'}
 const{data:jobs,error}=await db.from('notification_history').select('*').is('sent_at',null).is('error_code',null).lte('scheduled_at',now.toISOString()).order('scheduled_at',{ascending:true}).limit(100)
 if(error)return Response.json({error:'queue_read_failed'},{status:500})
 let processed=0
 for(const job of jobs||[]){
  if(testMode&&testInput.testUserId&&job.user_id!==testInput.testUserId)continue
  if(testMode&&testInput.testPeriod&&job.period!==testInput.testPeriod)continue
  const isWelcome=isWelcomeNotification(job),isDaily=!!job.period&&job.notification_id?.startsWith('daily-')
  if(!canDeliverNotification(job,now))continue
  if(isDaily&&(job.schedule_date!==saoPauloDate(now)||!isWithinMomentWindow(job.period,now))){
   await db.from('notification_history').update({suppression_reason:'moment-window-missed'}).eq('id',job.id)
   continue
  }
  const{data:recent}=await db.from('notification_history').select('notification_id,message_id,category,sent_at').eq('user_id',job.user_id).not('sent_at','is',null).order('sent_at',{ascending:false}).limit(7)
  let message:any
  if(isDaily){
   const{count}=await db.from('notification_history').select('*',{count:'exact',head:true}).eq('user_id',job.user_id).eq('schedule_date',job.schedule_date).not('period','is',null).not('sent_at','is',null)
   if((count||0)>=3){await db.from('notification_history').update({suppression_reason:'daily-limit-reached'}).eq('id',job.id);continue}
   const state=await loadDailyState(db,job)
   message=selectDailyMessage(job.period,state,recent||[],`${job.user_id}:${job.schedule_date}:${job.period}`)
   await db.from('notification_history').update({message_id:message.id,category:message.category,target_url:message.targetUrl,choice_reason:message.choiceReason,suppression_reason:null}).eq('id',job.id)
  }else message=messages.find(m=>m.id===job.notification_id)
  if(!message)continue
  const recentIds=new Set((recent||[]).map((r:any)=>r.message_id||r.notification_id))
  if(!isWelcome&&!isDaily&&recentIds.has(message.id))continue
  if(!isWelcome&&!isDaily&&(recent||[]).length>=2&&(recent||[]).slice(0,2).every((r:any)=>r.category===message.category))continue
  const{data:subs}=await db.from('push_subscriptions').select('endpoint,p256dh,auth').eq('user_id',job.user_id)
  if(!subs?.length){await db.from('notification_history').update({suppression_reason:'missing-subscription'}).eq('id',job.id);continue}
  const sentAt=new Date().toISOString()
  const{data:claimed}=await db.from('notification_history').update({sent_at:sentAt,suppression_reason:null}).eq('id',job.id).is('sent_at',null).select('id').maybeSingle()
  if(!claimed)continue
  try{
   for(const sub of subs)await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify({...message,url:message.targetUrl,notificationId:job.notification_id}))
   if(isWelcome)await db.from('profiles').update({welcome_notification_sent_at:sentAt}).eq('id',job.user_id)
   processed++
  }catch(e){
   const status=(e as{statusCode?:number}).statusCode
   await db.from('notification_history').update({sent_at:null,error_code:status===404||status===410?'subscription_expired':'push_failed'}).eq('id',job.id)
  }
 }
 return Response.json({scheduled,processed,scheduleError,testMode})
})
