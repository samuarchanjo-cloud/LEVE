'use client'
import { useEffect } from 'react'

export default function SwRegister(){
  useEffect(()=>{
    const captureInstallPrompt=(event)=>{
      event.preventDefault()
      window.__leveInstallPrompt=event
      window.dispatchEvent(new CustomEvent('leve-beforeinstallprompt',{detail:event}))
    }
    window.addEventListener('beforeinstallprompt',captureInstallPrompt)
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js').catch(()=>{})
    }
    return()=>window.removeEventListener('beforeinstallprompt',captureInstallPrompt)
  }, [])
  return null
}
