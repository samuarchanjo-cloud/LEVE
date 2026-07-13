'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {useRouter} from 'next/navigation'
import {supabase} from '../../../lib/supabaseClient'

const slides=[
 {tone:'green',content:(name)=><><div className="onboarding-logo">LEVE<span>●</span></div><h1>Bem-vindo ao Método LEVE, {name}.</h1><p>Viva no seu ritmo. Viva LEVE.</p></>},
 {tone:'light',content:()=> <><div className="organic-shape"/><h1>Você não precisa mudar tudo hoje.</h1><p className="delay-text">Só precisa cuidar do próximo passo.</p></>},
 {tone:'light',content:()=> <><h1>Aqui, cada pequena conquista importa.</h1><p>Alimentação, movimento, sono e autoestima caminham juntos.</p><div className="onboarding-pillars"><span>🥗<small>Alimentação</small></span><span>👟<small>Movimento</small></span><span>🌙<small>Sono</small></span><span>♡<small>Autoestima</small></span></div></>},
 {tone:'light',content:()=> <><div className="organic-lines"/><h1>Sem culpa. Sem pressa. Sem promessas impossíveis.</h1><p>O LEVE vai acompanhar sua rotina um dia de cada vez.</p></>},
 {tone:'light',content:()=> <><div className="journey-orbit"><i/></div><h1>Sua jornada começa agora.</h1><p>Estamos felizes por caminhar com você.</p></>},
]
export default function OnboardingPage(){
 const router=useRouter(),[step,setStep]=useState(0),[name,setName]=useState(''),[saving,setSaving]=useState(false),userId=useRef(null),lock=useRef(false),touch=useRef(null)
 useEffect(()=>{(async()=>{const{data:s}=await supabase.auth.getSession();if(!s.session){router.replace('/login');return}userId.current=s.session.user.id;const{data:p}=await supabase.from('profiles').select('nome,onboarding_completo,onboarding_completed').eq('id',s.session.user.id).single();if(!p?.onboarding_completo){router.replace('/app/perfil');return}if(p.onboarding_completed){router.replace('/app');return}const saved=Number(localStorage.getItem(`leve_onboarding_step_${s.session.user.id}`));if(Number.isInteger(saved)&&saved>0&&saved<slides.length)setStep(saved);setName(p.nome?.split(' ')[0]||'você')})()},[router])
 const finish=useCallback(async()=>{if(saving)return;setSaving(true);const{data:s}=await supabase.auth.getSession();if(!s.session)return;const{error}=await supabase.from('profiles').update({onboarding_completed:true,onboarding_completed_at:new Date().toISOString()}).eq('id',s.session.user.id);if(!error){localStorage.setItem(`leve_onboarding_${s.session.user.id}`,'complete');localStorage.removeItem(`leve_onboarding_step_${s.session.user.id}`);router.replace('/app')}else setSaving(false)},[router,saving])
 const advance=useCallback(()=>{if(lock.current)return;lock.current=true;setTimeout(()=>{lock.current=false},450);if(step===slides.length-1)finish();else setStep(v=>{const next=v+1;if(userId.current)localStorage.setItem(`leve_onboarding_step_${userId.current}`,String(next));return next})},[step,finish])
 function back(e){e.stopPropagation();if(step>0)setStep(v=>v-1)}
 function startTouch(e){touch.current=e.touches[0].clientX}
 function endTouch(e){if(touch.current==null)return;const dx=e.changedTouches[0].clientX-touch.current;touch.current=null;if(dx<-50)advance();if(dx>50&&step>0)setStep(v=>v-1)}
 const slide=slides[step]
 return <main className={`onboarding ${slide.tone}`} onTouchStart={startTouch} onTouchEnd={endTouch} onClick={advance}>
  <div className="onboarding-top">{step>0?<button onClick={back} aria-label="Voltar">‹</button>:<span/>}<button onClick={e=>{e.stopPropagation();finish()}}>Pular</button></div>
  <section className="onboarding-content" key={step}>{slide.content(name)}</section>
  <div className="onboarding-bottom"><div className="onboarding-dots">{slides.map((_,i)=><i className={i===step?'active':''} key={i}/>)}</div><button className={`onboarding-next ${step===4?'final':''}`} disabled={saving} onClick={e=>{e.stopPropagation();advance()}}>{step===4?(saving?'Salvando...':'Começar minha jornada'):'Continuar'}</button></div>
 </main>
}
