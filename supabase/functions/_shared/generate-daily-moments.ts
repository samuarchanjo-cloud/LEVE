import {selectDailyMessage,type RecentDelivery} from './daily-selector.ts'
import {loadDailyState} from './daily-state.ts'
import {dailyNotificationId,saoPauloDate,scheduledAt} from './daily-schedule.mjs'
import type {Period} from './messages.ts'

const PERIODS:Period[]=['morning','afternoon','evening']

export type GenerationSummary={
 scheduleDate:string
 usersAnalyzed:number
 eligibleUsers:number
 momentsCreated:number
 momentsSkipped:number
 suppressed:Record<string,number>
 errors:number
}

function increment(summary:GenerationSummary,reason:string,count=1){
 if(count<=0)return
 summary.suppressed[reason]=(summary.suppressed[reason]||0)+count
 summary.momentsSkipped+=count
}

export async function generateDailyMoments(db:any,now=new Date()):Promise<GenerationSummary>{
 const date=saoPauloDate(now)
 const summary:GenerationSummary={scheduleDate:date,usersAnalyzed:0,eligibleUsers:0,momentsCreated:0,momentsSkipped:0,suppressed:{},errors:0}
 const profileResult=await db.from('profiles').select('id,notification_permission')
 if(profileResult.error)throw profileResult.error
 const profiles=profileResult.data||[]
 summary.usersAnalyzed=profiles.length
 if(!profiles.length)return summary

 const permittedProfiles=profiles.filter((profile:{notification_permission:string|null})=>profile.notification_permission==='granted')
 increment(summary,'notification-permission-not-granted',(profiles.length-permittedProfiles.length)*PERIODS.length)
 const profileIds=permittedProfiles.map((profile:{id:string})=>profile.id)
 if(!profileIds.length)return summary
 const subscriptionResult=await db.from('push_subscriptions').select('user_id').in('user_id',profileIds).not('push_subscription_validated_at','is',null)
 if(subscriptionResult.error)throw subscriptionResult.error
 const subscribedIds=new Set((subscriptionResult.data||[]).map((subscription:{user_id:string})=>subscription.user_id))
 const eligibleIds=profileIds.filter((id:string)=>subscribedIds.has(id))
 summary.eligibleUsers=eligibleIds.length
 increment(summary,'missing-valid-push-subscription',(profileIds.length-eligibleIds.length)*PERIODS.length)
 if(!eligibleIds.length)return summary

 const existingResult=await db.from('notification_history').select('user_id,notification_id').in('user_id',eligibleIds).eq('schedule_date',date)
 if(existingResult.error)throw existingResult.error
 const existingKeys=new Set((existingResult.data||[]).map((job:{user_id:string;notification_id:string})=>`${job.user_id}:${job.notification_id}`))

 for(const userId of eligibleIds){
  try{
   const[state,recentResult]=await Promise.all([
    loadDailyState(db,userId,date,now),
    db.from('notification_history').select('message_id,category').eq('user_id',userId).not('sent_at','is',null).order('sent_at',{ascending:false}).limit(7),
   ])
   if(recentResult.error)throw recentResult.error
   const recent:RecentDelivery[]=[...(recentResult.data||[])]
   for(const period of PERIODS){
    const notificationId=dailyNotificationId(period,date),key=`${userId}:${notificationId}`
    if(existingKeys.has(key)){increment(summary,'already-exists');continue}
    const message=selectDailyMessage(period,state,recent,`${userId}:${date}:${period}`)
    const insertResult=await db.from('notification_history').insert({
     user_id:userId,
     notification_id:notificationId,
     schedule_date:date,
     period,
     message_id:message.id,
     category:message.category,
     scheduled_at:scheduledAt(userId,date,period).toISOString(),
     target_url:message.targetUrl,
     choice_reason:message.choiceReason,
    })
    if(!insertResult.error){
     existingKeys.add(key)
     recent.unshift({message_id:message.id,category:message.category})
     summary.momentsCreated++
    }else if(insertResult.error.code==='23505'){
     existingKeys.add(key)
     increment(summary,'concurrent-duplicate')
    }else throw insertResult.error
   }
  }catch(error){
   summary.errors++
   increment(summary,'user-generation-error',PERIODS.filter(period=>!existingKeys.has(`${userId}:${dailyNotificationId(period,date)}`)).length)
   console.error('[generate-daily-moments] user failed',{code:(error as{code?:string}).code||'unknown'})
  }
 }
 return summary
}
