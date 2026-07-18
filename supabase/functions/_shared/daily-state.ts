export type DailyState={water:boolean;food:boolean;movement:boolean;journal:boolean;habitsCompleted:number;streak:number;recipeId:string}

function previousDate(date:string,days=1){
 const value=new Date(`${date}T12:00:00Z`)
 value.setUTCDate(value.getUTCDate()-days)
 return value.toISOString().slice(0,10)
}

function calculateStreak(rows:{entry_date:string}[],date:string){
 const dates=new Set(rows.map(row=>row.entry_date))
 let current=dates.has(date)?date:previousDate(date),streak=0
 while(dates.has(current)){streak++;current=previousDate(current)}
 return streak
}

export async function loadDailyState(db:any,userId:string,date:string,now=new Date()):Promise<DailyState>{
 const[entryResult,profileResult,entriesResult]=await Promise.all([
  db.from('diario_entries').select('agua,alimentacao_consciente,movimento,sono_regular,gentileza,nota_do_dia').eq('user_id',userId).eq('entry_date',date).maybeSingle(),
  db.from('profiles').select('onboarding_completed_at').eq('id',userId).single(),
  db.from('diario_entries').select('entry_date').eq('user_id',userId).lte('entry_date',date).order('entry_date',{ascending:false}).limit(30),
 ])
 if(entryResult.error)throw entryResult.error
 if(profileResult.error)throw profileResult.error
 if(entriesResult.error)throw entriesResult.error
 const entry=entryResult.data,profile=profileResult.data,entries=entriesResult.data||[]
 const started=profile?.onboarding_completed_at?new Date(profile.onboarding_completed_at).getTime():now.getTime()
 const currentDay=Math.min(21,Math.max(1,Math.floor((now.getTime()-started)/86400000)+1))
 const exerciseResult=await db.from('exercise_completions').select('exercise_day').eq('user_id',userId).eq('exercise_day',currentDay).maybeSingle()
 if(exerciseResult.error)throw exerciseResult.error
 const habits=['agua','alimentacao_consciente','movimento','sono_regular','gentileza']
 return{
  water:!!entry?.agua,
  food:!!entry?.alimentacao_consciente,
  movement:!!entry?.movimento||!!exerciseResult.data,
  journal:!!entry?.nota_do_dia?.trim(),
  habitsCompleted:habits.filter(key=>entry?.[key]).length,
  streak:calculateStreak(entries,date),
  recipeId:'',
 }
}
