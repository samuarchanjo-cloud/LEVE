export const MOMENT_WINDOWS={
  morning:{start:7*60+30,end:9*60},
  afternoon:{start:12*60+30,end:15*60},
  evening:{start:19*60+45,end:21*60+30},
}

export function stableHash(value){
  let hash=2166136261
  for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)}
  return hash>>>0
}

export function stableMinute(userId,date,period){
  const window=MOMENT_WINDOWS[period],span=window.end-window.start+1
  return window.start+(stableHash(`${userId}:${date}:${period}`)%span)
}

export function saoPauloDate(date=new Date()){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
}

export function zonedDateTimeToUtc(date,hour,minute){
  const target=Date.UTC(...date.split('-').map((v,i)=>Number(v)-(i===1?1:0)),hour,minute)
  let guess=target
  for(let i=0;i<2;i++){
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess)).map(p=>[p.type,p.value]))
    const seen=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute))
    guess+=target-seen
  }
  return new Date(guess)
}

export function scheduledAt(userId,date,period){
  const minute=stableMinute(userId,date,period)
  return zonedDateTimeToUtc(date,Math.floor(minute/60),minute%60)
}

export function dailyNotificationId(period,date){return`daily-${period}-${date}`}

export function saoPauloMinute(date=new Date()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]))
  return Number(parts.hour)*60+Number(parts.minute)
}

export function isWithinMomentWindow(period,date=new Date()){
  const minute=saoPauloMinute(date),window=MOMENT_WINDOWS[period]
  return!!window&&minute>=window.start&&minute<=window.end
}
