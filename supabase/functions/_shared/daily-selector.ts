import {dailyMessages,fallbackMessages,type NotificationMessage,type Period,type MessageCondition} from './messages.ts'
import {stableHash} from './daily-schedule.mjs'
import type {DailyState} from './daily-state.ts'

export type RecentDelivery={message_id?:string|null;category:string}
const priorities:Record<Period,string[]>={
 morning:['motivation','hydration-pending','self-esteem','movement-pending'],
 afternoon:['food-pending','food-completed','hydration-pending','hydration-maintenance','reflection','movement-pending','movement-completed','recipe'],
 evening:['journal-pending','sleep','reflection','self-esteem','celebration','streak'],
}

function conditionMatches(condition:MessageCondition,state:DailyState){
 const map:Record<MessageCondition,boolean>={
  'water-pending':!state.water,'water-started':state.water,
  'food-pending':!state.food,'food-completed':state.food,
  'movement-pending':!state.movement,'movement-completed':state.movement,
  'journal-pending':!state.journal,'journal-completed':state.journal,
  'streak':state.streak>1,
 }
 return map[condition]
}

export function selectDailyMessage(period:Period,state:DailyState,recent:RecentDelivery[],seed:string){
 const recentIds=new Set(recent.map(r=>r.message_id).filter(Boolean)),lastCategory=recent[0]?.category
 let eligible=dailyMessages.filter(m=>m.period===period&&!(m.conditions||[]).some(c=>!conditionMatches(c,state))&&!recentIds.has(m.id))
 const categories=[...new Set(eligible.map(m=>m.category))]
 let categoryPool=priorities[period].filter(c=>categories.includes(c)&&c!==lastCategory)
 if(!categoryPool.length)categoryPool=priorities[period].filter(c=>categories.includes(c))
 const selectedCategory=categoryPool[stableHash(`${seed}:category`)%Math.max(1,categoryPool.length)]
 eligible=eligible.filter(m=>m.category===selectedCategory)
 let message=eligible[stableHash(`${seed}:message`)%Math.max(1,eligible.length)]
 let reason=`${period}:${selectedCategory}:${state.water?'water-started':'water-pending'}:${state.food?'food-completed':'food-pending'}:${state.movement?'movement-completed':'movement-pending'}:${state.journal?'journal-completed':'journal-pending'}`
 if(!message){
  const fallbacks=fallbackMessages.filter(m=>m.period===period&&!recentIds.has(m.id))
  message=fallbacks[stableHash(`${seed}:fallback`)%Math.max(1,fallbacks.length)]||fallbackMessages.find(m=>m.period===period)!
  reason=`${period}:generic-fallback:no-eligible-recent-message`
 }
 const recipeIds=['omelete','bowl','sopa','iogurte','doce']
 const recipeId=state.recipeId||recipeIds[stableHash(`${seed}:recipe`)%recipeIds.length]
 return{
  ...message,
  body:message.body.replaceAll('{streak}',String(state.streak)),
  targetUrl:message.targetUrl.replace('{recipeId}',recipeId),
  choiceReason:reason,
 }
}
