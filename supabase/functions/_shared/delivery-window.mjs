export function getSaoPauloHour(date=new Date()){
  return Number(new Intl.DateTimeFormat('en-US',{
    timeZone:'America/Sao_Paulo',hour:'2-digit',hour12:false,
  }).format(date))
}

export function isWelcomeNotification(job){
  return job?.notification_id==='welcome-01'||job?.category==='welcome'
}

export function canDeliverNotification(job,date=new Date()){
  if(isWelcomeNotification(job))return true
  const hour=getSaoPauloHour(date)
  return hour>=7&&hour<22
}
