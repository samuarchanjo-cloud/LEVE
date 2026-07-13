'use client'
import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {supabase} from '../lib/supabaseClient'
import {rememberDestination} from '../lib/authRedirect'

export default function NotificationTracker(){
 const router=useRouter()
 useEffect(()=>{(async()=>{
  const url=new URL(window.location.href),notificationId=url.searchParams.get('notification')
  const{data}=await supabase.auth.getSession()
  if(!data.session&&url.pathname.startsWith('/app')){rememberDestination();router.replace('/login');return}
  if(data.session&&url.pathname.startsWith('/app')&&!url.pathname.startsWith('/app/perfil')&&!url.pathname.startsWith('/app/onboarding')){
   const{data:profile}=await supabase.from('profiles').select('onboarding_completo,onboarding_completed').eq('id',data.session.user.id).single()
   if(profile&&!profile.onboarding_completo){router.replace('/app/perfil');return}
   if(profile&&!profile.onboarding_completed){router.replace('/app/onboarding');return}
  }
  if(data.session&&notificationId){
   await supabase.rpc('mark_notification_opened',{p_notification_id:notificationId})
   url.searchParams.delete('notification');window.history.replaceState({},'',url.pathname+(url.search||''))
  }
 })()},[router])
 return null
}
