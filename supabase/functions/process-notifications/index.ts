import {createClient} from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'
import {messages} from '../_shared/messages.ts'

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET=Deno.env.get('CRON_SECRET')!
const VAPID_PUBLIC_KEY=Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY=Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT=Deno.env.get('VAPID_SUBJECT')||'mailto:suporte@metodoleve.app'
webpush.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY)

Deno.serve(async req=>{
 if(req.headers.get('authorization')!==`Bearer ${CRON_SECRET}`)return new Response('Unauthorized',{status:401})
 const db=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false}})
 const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',hour:'2-digit',hour12:false}).format(new Date()))
 if(hour<8||hour>=22)return Response.json({processed:0,reason:'quiet_hours'})
 const {data:jobs,error}=await db.from('notification_history').select('*').is('sent_at',null).is('error_code',null).lte('scheduled_at',new Date().toISOString()).limit(100)
 if(error)return Response.json({error:'queue_read_failed'},{status:500})
 let processed=0
 for(const job of jobs||[]){
  const message=messages.find(m=>m.id===job.notification_id)
  if(!message)continue
  const since=new Date(Date.now()-24*60*60*1000).toISOString()
  const{data:recent}=await db.from('notification_history').select('notification_id,category,sent_at').eq('user_id',job.user_id).not('sent_at','is',null).order('sent_at',{ascending:false}).limit(7)
  if(job.category!=='welcome'&&(recent||[]).filter(r=>r.sent_at>=since).length>=2)continue
  if(job.category!=='welcome'&&(recent||[]).some(r=>r.notification_id===job.notification_id))continue
  if(job.category!=='welcome'&&(recent||[]).length>=2&&(recent||[]).slice(0,2).every(r=>r.category===job.category))continue
  if(['hydration','journal'].includes(job.category)){
   const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
   const{data:entry}=await db.from('diario_entries').select('agua,nota_do_dia').eq('user_id',job.user_id).eq('entry_date',today).maybeSingle()
   if(job.category==='hydration'&&entry?.agua)continue
   if(job.category==='journal'&&entry?.nota_do_dia?.trim())continue
  }
  if(job.category==='exercise'){
   const{data:profile}=await db.from('profiles').select('onboarding_completed_at').eq('id',job.user_id).single()
   const started=profile?.onboarding_completed_at?new Date(profile.onboarding_completed_at).getTime():Date.now()
   const currentDay=Math.min(21,Math.max(1,Math.floor((Date.now()-started)/86400000)+1))
   const{data:completed}=await db.from('exercise_completions').select('exercise_day').eq('user_id',job.user_id).eq('exercise_day',currentDay).maybeSingle()
   if(completed)continue
  }
  const {data:subs}=await db.from('push_subscriptions').select('endpoint,p256dh,auth').eq('user_id',job.user_id)
  if(!subs?.length)continue // Mantém pendente até a permissão ser concedida.
  try{
   for(const sub of subs)await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify({...message,url:message.targetUrl,notificationId:message.id}))
   await db.from('notification_history').update({sent_at:new Date().toISOString()}).eq('id',job.id)
   if(job.notification_id==='welcome-01')await db.from('profiles').update({welcome_notification_sent_at:new Date().toISOString()}).eq('id',job.user_id)
   processed++
  }catch(e){
   const status=(e as {statusCode?:number}).statusCode
   await db.from('notification_history').update({error_code:status===404||status===410?'subscription_expired':'push_failed'}).eq('id',job.id)
  }
 }
 return Response.json({processed})
})
