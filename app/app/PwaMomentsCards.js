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
 const env=usePwaEnvironment(),[tutorial,setTutorial]=useState(false),[busy,setBusy]=useState(false),[success,setSuccess]=useState(false),[notificationError,setNotificationError]=useState(''),restoring=useRef(false),validatedFor=useRef(null)
 const persistProfile=useCallback(async(patch,source='persistProfile')=>{
  if(!profile?.id){
   const error=new Error('Perfil não carregado para persistência')
   console.error(`[PwaMomentsCards] ${source}: perfil ausente`,{error,patchKeys:Object.keys(patch)})
   setNotificationError('Não foi possível salvar sua preferência. Recarregue o aplicativo e tente novamente.')
   throw error
  }
  const{data,error,status,statusText}=await supabase.from('profiles').update(patch).eq('id',profile.id).select('*').single()
  if(error){
   console.error(`[PwaMomentsCards] ${source}: falha no update de profiles`,{error,code:error.code,message:error.message,details:error.details,hint:error.hint,status,statusText,patchKeys:Object.keys(patch)})
   setNotificationError('Não foi possível salvar sua preferência de notificações. Tente novamente.')
   throw error
  }
  console.info(`[PwaMomentsCards] ${source}: perfil persistido`,{notificationPermission:data.notification_permission,notificationPermissionGrantedAt:data.notification_permission_granted_at})
  onProfileChange?.(data)
  return data
 },[profile?.id,onProfileChange])
 const saveSubscription=useCallback(async(subscription,source='saveSubscription')=>{
  const json=subscription.toJSON(),now=new Date().toISOString()
  if(!profile?.id||!json.endpoint||!json.keys?.p256dh||!json.keys?.auth){
   const error=new Error('PushSubscription incompleta')
   console.error(`[PwaMomentsCards] ${source}: subscription inválida`,{error,hasProfile:!!profile?.id,hasEndpoint:!!json.endpoint,hasP256dh:!!json.keys?.p256dh,hasAuth:!!json.keys?.auth})
   setNotificationError('Não foi possível validar a assinatura de notificações neste dispositivo.')
   throw error
  }
  const subscriptionPayload={user_id:profile.id,endpoint:json.endpoint,p256dh:json.keys.p256dh,auth:json.keys.auth,push_subscription_validated_at:now}
  const{data:subscriptionData,error:subscriptionError,status:subscriptionStatus,statusText:subscriptionStatusText}=await supabase.from('push_subscriptions').upsert(subscriptionPayload,{onConflict:'endpoint'}).select('id,push_subscription_validated_at').single()
  if(subscriptionError){
   console.error(`[PwaMomentsCards] ${source}: falha no upsert de push_subscriptions`,{error:subscriptionError,code:subscriptionError.code,message:subscriptionError.message,details:subscriptionError.details,hint:subscriptionError.hint,status:subscriptionStatus,statusText:subscriptionStatusText,hasValidatedAt:!!subscriptionPayload.push_subscription_validated_at})
   setNotificationError('Não foi possível salvar a assinatura de notificações. Tente novamente.')
   throw subscriptionError
  }
  console.info(`[PwaMomentsCards] ${source}: upsert de push_subscriptions concluído`,{subscriptionId:subscriptionData.id,validatedAt:subscriptionData.push_subscription_validated_at})
  let profileData
  try{
   profileData=await persistProfile({notification_permission:'granted',notification_permission_granted_at:profile.notification_permission_granted_at||now},`${source}.profile`)
  }catch(error){
   console.error(`[PwaMomentsCards] ${source}: subscription salva, mas perfil não atualizado`,{error,code:error?.code,message:error?.message,details:error?.details,hint:error?.hint})
   setNotificationError('A assinatura foi criada, mas não foi possível concluir a ativação no seu perfil. Tente novamente.')
   throw error
  }
  validatedFor.current=profile.id
  return{subscription:subscriptionData,profile:profileData}
 },[profile?.id,profile?.notification_permission_granted_at,persistProfile])
 const restoreSubscription=useCallback(async()=>{
  console.info('[PwaMomentsCards] restoreSubscription: ambiente detectado',{permission:env.permission,nativePermission:typeof Notification==='undefined'?'unsupported':Notification.permission,supportsPush:env.supportsPush,hasProfile:!!profile?.id,alreadyRestoring:restoring.current,alreadyValidated:validatedFor.current===profile?.id})
  if(!profile?.id||!env.supportsPush||env.permission!=='granted'||restoring.current||validatedFor.current===profile.id){
   console.info('[PwaMomentsCards] restoreSubscription: restauração ignorada',{reason:!profile?.id?'missing-profile':!env.supportsPush?'push-unsupported':env.permission!=='granted'?'permission-not-granted':restoring.current?'already-restoring':'already-validated'})
   return
  }
  restoring.current=true
  try{
   const reg=await navigator.serviceWorker.ready
   let sub=await reg.pushManager.getSubscription()
   console.info('[PwaMomentsCards] restoreSubscription: subscription consultada',{exists:!!sub})
   if(!sub){
    sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:toKey(VAPID_PUBLIC_KEY)})
    console.info('[PwaMomentsCards] restoreSubscription: nova subscription criada',{exists:!!sub})
   }
   const result=await saveSubscription(sub,'restoreSubscription')
   console.info('[PwaMomentsCards] restoreSubscription: restauração concluída',{upsertSucceeded:!!result.subscription,profileUpdateSucceeded:!!result.profile,validatedAt:result.subscription?.push_subscription_validated_at,permission:result.profile?.notification_permission})
   setNotificationError('')
  }catch(error){
   console.error('[PwaMomentsCards] restoreSubscription: falha na restauração',{error,code:error?.code,message:error?.message,details:error?.details,hint:error?.hint,permission:env.permission})
   setNotificationError(current=>current||'Não foi possível restaurar as notificações neste dispositivo. Toque em tentar novamente.')
  }finally{restoring.current=false}
 },[profile?.id,env.supportsPush,env.permission,saveSubscription])
 useEffect(()=>{restoreSubscription()},[restoreSubscription])
 useEffect(()=>{if(env.isStandalone&&!profile?.pwa_installed_at)persistProfile({pwa_installed_at:new Date().toISOString()},'standaloneDetected').catch(error=>console.error('[PwaMomentsCards] standaloneDetected: persistência rejeitada',{error,message:error?.message}))},[env.isStandalone,profile?.pwa_installed_at,persistProfile])
 useEffect(()=>{if(!profile?.id||!env.ready)return;if(env.permission==='denied'&&profile.notification_permission!=='denied')persistProfile({notification_permission:'denied',notification_permission_denied_at:profile.notification_permission_denied_at||new Date().toISOString()},'permissionDetected.denied').catch(error=>console.error('[PwaMomentsCards] permissionDetected.denied: persistência rejeitada',{error,message:error?.message}));if(env.permission==='default'&&env.supportsPush&&(!env.isIOS||env.isStandalone)&&!profile.notification_prompt_shown_at)persistProfile({notification_prompt_shown_at:new Date().toISOString(),notification_permission:'default'},'permissionDetected.default').catch(error=>console.error('[PwaMomentsCards] permissionDetected.default: persistência rejeitada',{error,message:error?.message}))},[env.ready,env.permission,env.supportsPush,env.isIOS,env.isStandalone,profile,persistProfile])
 async function dismissTutorial(){setTutorial(false);await persistProfile({install_tutorial_dismissed_at:new Date().toISOString()})}
 async function installAndroid(){setBusy(true);const installed=await env.install();if(installed)await persistProfile({pwa_installed_at:new Date().toISOString()});setBusy(false)}
 async function requestMoments(){
  if(!env.supportsPush||busy)return
  setBusy(true);setNotificationError('')
  try{
   await persistProfile({notification_prompt_shown_at:profile.notification_prompt_shown_at||new Date().toISOString()},'requestMoments.promptShown')
   const result=await Notification.requestPermission();env.setPermission(result)
   console.info('[PwaMomentsCards] requestMoments: permissão retornada',{permission:result})
   if(result==='granted'){const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();console.info('[PwaMomentsCards] requestMoments: subscription consultada',{exists:!!sub});if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:toKey(VAPID_PUBLIC_KEY)});await saveSubscription(sub,'requestMoments');setSuccess(true);setTimeout(()=>setSuccess(false),5000)}
   else if(result==='denied')await persistProfile({notification_permission:'denied',notification_permission_denied_at:new Date().toISOString()},'requestMoments.denied')
  }catch(error){
   console.error('[PwaMomentsCards] requestMoments: falha na ativação',{error,code:error?.code,message:error?.message,details:error?.details,hint:error?.hint,permission:Notification.permission})
   setNotificationError(current=>current||'Não foi possível ativar os Momentos LEVE. Verifique sua conexão e tente novamente.')
  }finally{setBusy(false)}
 }
 if(!env.ready||!profile)return null
 const showIOSInstall=env.isIOS&&!env.isStandalone
 const showAndroidInstall=env.isAndroid&&!env.isStandalone&&env.canPromptInstall
 const canShowNotification=env.supportsPush&&env.permission==='default'&&(!env.isIOS||env.isStandalone)
 const showNotificationCard=canShowNotification||!!notificationError
 const installSteps=env.iosBrowser==='chrome'?CHROME_STEPS:SAFARI_STEPS
 const fallbackBrowser=env.iosBrowser==='other'
 return <>
  {showIOSInstall&&<section className="card install-card"><div className="card-title"><div><span className="eyebrow">Aplicativo</span><h3>Leve o LEVE com você 🌿</h3></div><span className="install-symbol">⇧</span></div><p>Instale o Método LEVE na sua tela inicial para acessar mais rápido e receber seus Momentos LEVE.</p><button className="btn btn-secondary" onClick={()=>setTutorial(true)}>Ver como instalar</button></section>}
  {showAndroidInstall&&<section className="card install-card"><div className="card-title"><div><span className="eyebrow">Aplicativo</span><h3>Instale o Método LEVE</h3></div><span className="install-symbol">＋</span></div><p>Acesse mais rápido e receba lembretes no momento certo.</p><button className="btn btn-secondary" disabled={busy} onClick={installAndroid}>{busy?'Abrindo...':'Instalar aplicativo'}</button></section>}
  {showNotificationCard&&<section className="card moments-card"><div className="card-title"><div><span className="eyebrow">Momentos LEVE</span><h3>{notificationError?'Não foi possível concluir a ativação':'Ative os Momentos LEVE'}</h3></div><span>🔔</span></div>{notificationError?<p role="alert">{notificationError}</p>:<p>Receba mensagens de motivação, hidratação, alimentação e cuidado ao longo do dia.</p>}<button className="btn btn-secondary moments-button" disabled={busy} onClick={requestMoments}>{busy?'Ativando...':notificationError?'Tentar novamente':'Permitir notificações'}</button><small className="muted">Você poderá desativá-las quando quiser.</small></section>}
  {env.supportsPush&&env.permission==='denied'&&<p className="notification-denied">As notificações estão bloqueadas neste dispositivo. Você pode ativá-las nas configurações quando quiser.</p>}
  {success&&<div className="moments-success" role="status">Momentos LEVE ativados 🌿</div>}
  {tutorial&&<div className="install-overlay" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={dismissTutorial}><div className="install-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="Fechar tutorial" onClick={dismissTutorial}>×</button><div className="install-modal-scroll"><span className="eyebrow">No iPhone ou iPad</span><h2 id="install-title">Instale o Método LEVE no seu iPhone</h2>{fallbackBrowser&&<p className="browser-note">A posição dos botões pode variar conforme o navegador.</p>}<ol className="install-steps">{installSteps.map(([icon,text],index)=><li key={text}><b aria-hidden="true">{icon}</b><span><small>Passo {index+1}</small>{text}</span></li>)}</ol></div><button className="btn" onClick={dismissTutorial}>Entendi</button></div></div>}
 </>
}
