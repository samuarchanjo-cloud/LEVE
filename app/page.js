'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function Home(){
  const router = useRouter()
  useEffect(()=>{
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if(!active) return
      if(data.session) router.replace('/app')
      else router.replace('/login')
    })
    return () => { active = false }
  }, [router])
  return (
    <div className="container" style={{textAlign:'center', paddingTop:120}}>
      <h1>LEVE</h1>
      <p>Carregando...</p>
    </div>
  )
}
