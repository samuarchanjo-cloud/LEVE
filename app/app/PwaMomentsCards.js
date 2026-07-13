'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {supabase,VAPID_PUBLIC_KEY} from '../../lib/supabaseClient'
import {usePwaEnvironment} from '../../lib/pwa/usePwaEnvironment'

function toKey(value){const p='='.repeat((4-value.length%4)%4),raw=atob((value+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}

const SAFARI_STEPS=[
 ['•••','No canto inferior direito, toque nos três pontinhos.'],
 ['⇧','Em seguida, toque em “Compartilhar”.'],
 ['↓','Role a tela para baixo.'],
 ['＋','Toque em “Adicionar à Tela de Início”.'],
 ['✓','Confirme tocando em “Adicionar”.'],
 ['🌿','Abra o Método LEVE pelo novo ícone na sua tela inicial.'],
]
const CHROME_STEPS=[
 ['⇧','Na barra de endereço, toque no ícone de compartilhar.'],
 ['↓','Role as opções para baixo.'],
 ['＋','Toque em “Adicionar à Tela de Início”.'],
 ['✓','Confirme tocando em “Adicionar”.'],
 ['🌿','Abra o Método LEVE pelo novo ícone na sua tela inicial.'],
]

export default function PwaMomentsCards({profile,onProfileChange}){
 const env=usePwaEnvironment(),[tutorial,setTutorial]=useState(false),[busy,setBusy]=useState(false),[success,setSuccess]=useState(false),restoring=useRef(false),validatedFor=useRef(null)
 const persistProfile=useCallback(async patch=>{if(!profile?.id)return;onProfileChange?.({...profile,...patch});await supabase.from('profiles').update(patch).eq('id',profile.id)},[profile,onProfileChange])
 const saveSubscription=useCallback(async subscription=>{
  const json=subscription.toJSON(),now=new Date().toISOString()
  const{error}=await supabase.from('push_subscriptions').upsert({user_id:profile.id,endpoint:json.endpoint,p256dh:json.keys.p256dh,auth:json.keys.auth,push_subscription_validated_at:now},{onConflict:'endpoint'})
  if(error)throw error
  validatedFor.current=profile.id
  await persistProfile({notification_permission:'granted',notification_permission_granted_at:profile.notification_permission_granted_at||now})
 },[profile,persistProfile])
 const restoreSubscription=useCallback(async()=>{
  if(!profile?.id||!env.supportsPush||env.permission!=='granted'||restoring.current||validatedFor.current===profile.id)return
  restoring.current=true
  try{const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:toKey(VAPID_PUBLIC_KEY)});await saveSubscription(sub)}catch{}finally{restoring.current=false}
 },[profile?.id,env.supportsPush,env.permission,saveSubscription])
 useEffect(()=>{restoreSubscription()},[restoreSubscription])
 useEffect(()=>{if(env.isStandalone&&!profile?.pwa_installed_at)persistProfile({pwa_installed_at:new Date().toISOString()})},[env.isStandalone,profile?.pwa_installed_at,persistProfile])
 useEffect(()=>{if(!profile?.id||!env.ready)return;if(env.permission==='denied'&&profile.notification_permission!=='denied')persistProfile({notification_permission:'denied',notification_permission_denied_at:profile.notification_permission_denied_at||new Date().toISOString()});if(env.permission==='default'&&env.supportsPush&&(!env.isIOS||env.isStandalone)&&!profile.notification_prompt_shown_at)persistProfile({notification_prompt_shown_at:new Date().toISOString(),notification_permission:'default'})},[env.ready,env.permission,env.supportsPush,env.isIOS,env.isStandalone,profile,persistProfile])
 async function dismissTutorial(){setTutorial(false);await persistProfile({install_tutorial_dismissed_at:new Date().toISOString()})}
 async function installAndroid(){setBusy(true);const installed=await env.install();if(installed)await persistProfile({pwa_installed_at:new Date().toISOString()});setBusy(false)}
 async function requestMoments(){
  if(!env.supportsPush||busy)return
  setBusy(true);await persistProfile({notification_prompt_shown_at:profile.notification_prompt_shown_at||new Date().toISOString()})
  try{
   const result=await Notification.requestPermission();env.setPermission(result)
   if(result==='granted'){const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:toKey(VAPID_PUBLIC_KEY)});await saveSubscription(sub);setSuccess(true);setTimeout(()=>setSuccess(false),5000)}
   else if(result==='denied')await persistProfile({notification_permission:'denied',notification_permission_denied_at:new Date().toISOString()})
  }catch{}finally{setBusy(false)}
 }
 if(!env.ready||!profile)return null
 const showIOSInstall=env.isIOS&&!env.isStandalone
 const showAndroidInstall=env.isAndroid&&!env.isStandalone&&env.canPromptInstall
 const canShowNotification=env.supportsPush&&env.permission==='default'&&(!env.isIOS||env.isStandalone)
 const installSteps=env.iosBrowser==='chrome'?CHROME_STEPS:SAFARI_STEPS
 const fallbackBrowser=env.iosBrowser==='other'
 return <>
  {showIOSInstall&&<section className="card install-card"><div className="card-title"><div><span className="eyebrow">Aplicativo</span><h3>Leve o LEVE com você 🌿</h3></div><span className="install-symbol">⇧</span></div><p>Instale o Método LEVE na sua tela inicial para acessar mais rápido e receber seus Momentos LEVE.</p><button className="btn btn-secondary" onClick={()=>setTutorial(true)}>Ver como instalar</button></section>}
  {showAndroidInstall&&<section className="card install-card"><div className="card-title"><div><span className="eyebrow">Aplicativo</span><h3>Instale o Método LEVE</h3></div><span className="install-symbol">＋</span></div><p>Acesse mais rápido e receba lembretes no momento certo.</p><button className="btn btn-secondary" disabled={busy} onClick={installAndroid}>{busy?'Abrindo...':'Instalar aplicativo'}</button></section>}
  {canShowNotification&&<section className="card moments-card"><div className="card-title"><div><span className="eyebrow">Momentos LEVE</span><h3>Ative os Momentos LEVE</h3></div><span>🔔</span></div><p>Receba mensagens de motivação, hidratação, alimentação e cuidado ao longo do dia.</p><button className="btn btn-secondary moments-button" disabled={busy} onClick={requestMoments}>{busy?'Ativando...':'Permitir notificações'}</button><small className="muted">Você poderá desativá-las quando quiser.</small></section>}
  {env.supportsPush&&env.permission==='denied'&&<p className="notification-denied">As notificações estão bloqueadas neste dispositivo. Você pode ativá-las nas configurações quando quiser.</p>}
  {success&&<div className="moments-success" role="status">Momentos LEVE ativados 🌿</div>}
  {tutorial&&<div className="install-overlay" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={dismissTutorial}><div className="install-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="Fechar tutorial" onClick={dismissTutorial}>×</button><div className="install-modal-scroll"><span className="eyebrow">No iPhone ou iPad</span><h2 id="install-title">Instale o Método LEVE no seu iPhone</h2>{fallbackBrowser&&<p className="browser-note">A posição dos botões pode variar conforme o navegador.</p>}<ol className="install-steps">{installSteps.map(([icon,text],index)=><li key={text}><b aria-hidden="true">{icon}</b><span><small>Passo {index+1}</small>{text}</span></li>)}</ol></div><button className="btn" onClick={dismissTutorial}>Entendi</button></div></div>}
 </>
}
