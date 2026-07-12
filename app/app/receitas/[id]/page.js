'use client'
import {useEffect,useState} from 'react'
import {useParams,useRouter} from 'next/navigation'
import {RECIPES} from '../../../../lib/recipes'
import NavBar from '../../NavBar'
export default function ReceitaDetalhe(){
 const {id}=useParams(),router=useRouter(),recipe=RECIPES.find(r=>r.id===id),[favorite,setFavorite]=useState(false)
 useEffect(()=>{setFavorite(JSON.parse(localStorage.getItem('leve_favoritas')||'[]').includes(id))},[id])
 function fav(){const a=JSON.parse(localStorage.getItem('leve_favoritas')||'[]'),n=a.includes(id)?a.filter(x=>x!==id):[...a,id];localStorage.setItem('leve_favoritas',JSON.stringify(n));setFavorite(n.includes(id))}
 if(!recipe)return <div className="container"><h1>Receita nao encontrada</h1><button className="btn" onClick={()=>router.back()}>Voltar</button></div>
 return <div className="container"><div className="recipe-page-hero"><img src={recipe.image} alt={recipe.title}/><button className="recipe-page-back" onClick={()=>router.back()}>‹</button><button className="recipe-page-fav" onClick={fav}>{favorite?'♥':'♡'}</button></div><span className="pill">{recipe.meal}</span><h1 style={{margin:'10px 0'}}>{recipe.title}</h1><div style={{display:'flex',gap:20,color:'var(--muted)',fontSize:13,paddingBottom:20,borderBottom:'1px solid var(--line)'}}><span>◷ {recipe.time}</span><span>♨ {recipe.kcal}</span><span>♧ Facil</span></div><section style={{padding:'22px 4px'}}><h3>Ingredientes</h3><ul style={{paddingLeft:18,lineHeight:1.9}}>{recipe.ingredientes.map(i=><li key={i}>{i}</li>)}</ul></section><section style={{padding:'4px 4px 24px'}}><h3>Modo de preparo</h3><p className="muted" style={{lineHeight:1.75}}>{recipe.preparo}</p></section><button className="btn">Quero fazer essa receita</button><NavBar/></div>
}
