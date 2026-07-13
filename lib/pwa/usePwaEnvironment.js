'use client'
import {useEffect,useMemo,useState} from 'react'

export function usePwaEnvironment(){
 const [deferredPrompt,setDeferredPrompt]=useState(null)
 const [installedByEvent,setInstalledByEvent]=useState(false)
 const [permission,setPermission]=useState('unsupported')
 const [ready,setReady]=useState(false)
 const environment=useMemo(()=>{
  if(typeof window==='undefined')return{platform:'desktop',isIOS:false,isAndroid:false,isStandalone:false,supportsPush:false}
  const ua=navigator.userAgent||'',isIPadDesktop=navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1
  const isIOS=/iPhone|iPad|iPod/i.test(ua)||isIPadDesktop,isAndroid=/Android/i.test(ua)
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true||installedByEvent
  const supportsPush='Notification'in window&&'serviceWorker'in navigator&&'PushManager'in window
  return{platform:isIOS?'ios':isAndroid?'android':'desktop',isIOS,isAndroid,isStandalone,supportsPush}
 },[installedByEvent])
 useEffect(()=>{
  if('Notification'in window)setPermission(Notification.permission)
  const onPrompt=e=>{e.preventDefault();setDeferredPrompt(e)}
  const onCaptured=e=>setDeferredPrompt(e.detail)
  const onInstalled=()=>{setInstalledByEvent(true);setDeferredPrompt(null)}
  window.addEventListener('beforeinstallprompt',onPrompt)
  window.addEventListener('leve-beforeinstallprompt',onCaptured)
  window.addEventListener('appinstalled',onInstalled)
  if(window.__leveInstallPrompt)setDeferredPrompt(window.__leveInstallPrompt)
  setReady(true)
  return()=>{window.removeEventListener('beforeinstallprompt',onPrompt);window.removeEventListener('leve-beforeinstallprompt',onCaptured);window.removeEventListener('appinstalled',onInstalled)}
 },[])
 async function install(){
  if(!deferredPrompt)return false
  await deferredPrompt.prompt()
  const choice=await deferredPrompt.userChoice
  window.__leveInstallPrompt=null
  setDeferredPrompt(null)
  return choice?.outcome==='accepted'
 }
 return{...environment,ready,permission,setPermission,canPromptInstall:!!deferredPrompt,install}
}
