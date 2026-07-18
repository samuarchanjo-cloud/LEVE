import {createClient} from 'npm:@supabase/supabase-js@2.45.4'
import {generateDailyMoments} from '../_shared/generate-daily-moments.ts'

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET=Deno.env.get('GENERATE_DAILY_MOMENTS_CRON_SECRET')!

function isAuthorized(req:Request){
 const authorization=req.headers.get('authorization')
 const cronHeader=req.headers.get('x-cron-secret')
 return!!CRON_SECRET&&(authorization===`Bearer ${CRON_SECRET}`||cronHeader===CRON_SECRET)
}

Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{Allow:'POST'}})
 if(!isAuthorized(req))return new Response('Unauthorized',{status:401})
 const startedAt=Date.now()
 try{
  const db=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false}})
  const summary=await generateDailyMoments(db,new Date())
  console.info('[generate-daily-moments] completed',{...summary,durationMs:Date.now()-startedAt})
  return Response.json(summary)
 }catch(error){
  console.error('[generate-daily-moments] failed',{code:(error as{code?:string}).code||'unknown',durationMs:Date.now()-startedAt})
  return Response.json({error:'daily_moments_generation_failed'},{status:500})
 }
})
