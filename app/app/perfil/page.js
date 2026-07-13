'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function PerfilPage(){
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nome:'', idade:'', altura_cm:'', peso_atual_kg:'', peso_meta_kg:'', alergias:'',
    intolerante_lactose:false, diabetico:false, hipertenso:false,
  })

  useEffect(()=>{
    (async ()=>{
      const { data: sessionData } = await supabase.auth.getSession()
      if(!sessionData.session){ router.replace('/login'); return }
      setLoading(false)
    })()
  }, [router])

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    if(!form.nome || !form.idade || !form.altura_cm || !form.peso_atual_kg){
      setError('Preencha nome, idade, altura e peso atual pra continuar.')
      return
    }
    setSaving(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session.user.id
    const pesoAtual = parseFloat(form.peso_atual_kg)
    const { error: updError } = await supabase.from('profiles').update({
      nome: form.nome,
      idade: parseInt(form.idade, 10),
      altura_cm: parseInt(form.altura_cm, 10),
      peso_inicial_kg: pesoAtual,
      peso_atual_kg: pesoAtual,
      peso_meta_kg: form.peso_meta_kg ? parseFloat(form.peso_meta_kg) : null,
      alergias: form.alergias || null,
      intolerante_lactose: form.intolerante_lactose,
      diabetico: form.diabetico,
      hipertenso: form.hipertenso,
      onboarding_completo: true,
    }).eq('id', userId)
    setSaving(false)
    if(updError){ setError('Nao foi possivel salvar. Tente novamente.'); return }
    await supabase.rpc('schedule_welcome_notification')
    router.replace('/app/onboarding')
  }

  if(loading) return <div className="container" style={{textAlign:'center', paddingTop:120}}>Carregando...</div>

  return (
    <div className="container">
      <div style={{margin:'28px 0 18px', textAlign:'center'}}>
        <h1>Antes de comecar</h1>
        <p style={{color:'var(--text-muted)', fontSize:14}}>Esse formulario nos ajuda a acompanhar sua evolucao com mais cuidado. Leva menos de 1 minuto.</p>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Seu nome" value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} required/>
        <input type="number" placeholder="Idade" value={form.idade} onChange={e=>setForm({...form, idade:e.target.value})} required/>
        <input type="number" placeholder="Altura (cm)" value={form.altura_cm} onChange={e=>setForm({...form, altura_cm:e.target.value})} required/>
        <input type="number" step="0.1" placeholder="Peso atual (kg)" value={form.peso_atual_kg} onChange={e=>setForm({...form, peso_atual_kg:e.target.value})} required/>
        <input type="number" step="0.1" placeholder="Meta de peso (kg) - opcional" value={form.peso_meta_kg} onChange={e=>setForm({...form, peso_meta_kg:e.target.value})}/>
        <textarea placeholder="Tem alguma alergia alimentar? (opcional)" value={form.alergias} onChange={e=>setForm({...form, alergias:e.target.value})} rows={2}/>

        <label className="check-row">
          <input type="checkbox" checked={form.intolerante_lactose} onChange={e=>setForm({...form, intolerante_lactose:e.target.checked})}/>
          Sou intolerante a lactose
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.diabetico} onChange={e=>setForm({...form, diabetico:e.target.checked})}/>
          Sou diabetico(a)
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.hipertenso} onChange={e=>setForm({...form, hipertenso:e.target.checked})}/>
          Tenho pressao alta (hipertensao)
        </label>

        <p style={{fontSize:12, color:'var(--text-muted)', margin:'14px 0'}}>
          Essas informacoes ficam protegidas e sao usadas apenas para personalizar avisos de seguranca dentro do app. Elas nao substituem acompanhamento medico.
        </p>

        <button className="btn" type="submit" disabled={saving} style={{marginTop:4}}>
          {saving ? 'Salvando...' : 'Comecar minha jornada'}
        </button>
      </form>
    </div>
  )
}
