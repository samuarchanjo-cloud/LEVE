'use client'
import {useEffect,useState} from 'react'
import {useRouter} from 'next/navigation'
import {supabase} from '../../../lib/supabaseClient'
import {RECIPES,CONTAINS_LABEL} from '../../../lib/recipes'
import NavBar from '../NavBar'
const FILTERS=['Todos','Cafe da manha','Almoco','Jantar','Lanche','Sobremesa','Favoritas']
export default function ReceitasPage(){
 const router=useRouter(),[loading,setLoading]=useState(true),[expired,setExpired]=useState(false),[profile,setProfile]=useState(null),[openId,setOpenId]=useState(null),[filter,setFilter]=useState('Todos'),[favorites,setFavorites]=useState([])
 useEffect(()=>{setFavorites(JSON.parse(localStorage.getItem('leve_favoritas')||'[]'));(async()=>{const{data:s}=await supabase.auth.getSession();if(!s.session){router.replace('/login');return}const{data:p}=await supabase.from('profiles').select('*').eq('id',s.session.user.id).single();if(p&&!p.onboarding_completo){router.replace('/app/perfil');return}setProfile(p);setExpired(p?.subscription_status==='trial'&&new Date(p.trial_ends_at)<new Date());setLoading(false)})()},[router])
 function fav(id,e){e.stopPropagation();const n=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];setFavorites(n);localStorage.setItem('leve_favoritas',JSON.stringify(n))}
 function alerta(r){const a=(profile?.alergias||'').toLowerCase();return(r.contains.includes('lactose')&&(profile?.intolerante_lactose||a.includes('leite')||a.includes('lactose')))||(r.contains.includes('amendoim')&&a.includes('amendoim'))}
 if(loading)return <div className="loading">Montando seu catalogo...</div>
 if(expired)return <div className="container"><div className="card" style={{textAlign:'center',marginTop:60}}><h1>Receitas para continuar leve</h1><p className="muted">Seu periodo de teste terminou.</p><a className="btn" href="https://pay.kiwify.com.br/SEU-LINK-DE-ASSINATURA">Conhecer planos</a></div><NavBar/></div>
 const visible=RECIPES.filter(r=>filter==='Todos'||(filter==='Favoritas'?favorites.includes(r.id):r.meal===filter))
 return <div className="container"><header className="header"><div><span className="eyebrow">Sabores simples</span><h1>Receitas LEVE</h1><p className="muted" style={{fontSize:13}}>Nutrir tambem pode ser prazeroso.</p></div><button className="icon-btn" onClick={()=>setFilter('Favoritas')}>♡</button></header><div className="filters">{FILTERS.map(f=><button key={f} className={`filter ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>{f}</button>)}</div>
 {visible.length===0&&<div className="card" style={{textAlign:'center'}}><span style={{fontSize:30}}>♡</span><h3>Nenhuma favorita ainda</h3><p className="muted">Toque no coracao de uma receita para guardar.</p></div>}
 {visible.map(r=><article className="card recipe-card" key={r.id} onClick={()=>router.push(`/app/receitas/${r.id}`)}><img className="recipe-image" src={r.image} alt={r.title} loading="lazy"/><div className="recipe-body"><div className="card-title"><div><span className="pill">{r.meal}</span><h2 style={{fontSize:17,margin:'7px 0 5px'}}>{r.title}</h2><small className="muted">{r.time} &nbsp; · &nbsp; {r.kcal}</small></div><button className="favorite" aria-label="Favoritar" onClick={e=>fav(r.id,e)}>{favorites.includes(r.id)?'♥':'♡'}</button></div>{r.contains.length>0&&<span className={`pill ${alerta(r)?'pill-warn':''}`}>{r.contains.map(c=>CONTAINS_LABEL[c]).join(' · ')}</span>}</div></article>)}<NavBar/></div>
}
