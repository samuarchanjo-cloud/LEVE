'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

function traduzErro(msg){
  if(!msg) return 'Algo deu errado. Tente novamente.'
  if(msg.includes('already registered') || msg.includes('already been registered')) return 'Esse e-mail ja tem cadastro. Faca login.'
  if(msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if(msg.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  return msg
}

export default function LoginPage(){
  const router = useRouter()
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSubmit(e){
    e.preventDefault()
    setError(''); setInfo(''); setLoading(true)
    try{
      if(mode === 'signup'){
        const { data, error } = await supabase.auth.signUp({ email, password })
        if(error) throw error
        if(data.session){
          router.replace('/app')
        } else {
          setInfo('Cadastro feito! Verifique seu e-mail para confirmar a conta e depois faca login.')
          setMode('signin')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if(error) throw error
        router.replace('/app')
      }
    } catch(err){
      setError(traduzErro(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div style={{textAlign:'center', margin:'32px 0'}}>
        <h1>LEVE</h1>
        <p style={{color:'var(--text-muted)'}}>Seu app diario de habitos para emagrecer com leveza.</p>
      </div>

      <div className="tabs">
        <div className={`tab ${mode==='signup'?'active':''}`} onClick={()=>setMode('signup')}>Criar conta</div>
        <div className={`tab ${mode==='signin'?'active':''}`} onClick={()=>setMode('signin')}>Ja tenho conta</div>
      </div>

      {info && <p className="pill" style={{display:'block', marginBottom:16}}>{info}</p>}
      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Seu e-mail" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Sua senha" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Um instante...' : mode==='signup' ? 'Comecar meu teste gratis de 7 dias' : 'Entrar'}
        </button>
      </form>

      {mode==='signup' && (
        <p style={{fontSize:12, color:'var(--text-muted)', textAlign:'center', marginTop:14}}>
          Ao criar conta voce libera 7 dias gratis do Metodo LEVE, sem cartao de credito.
        </p>
      )}
    </div>
  )
}
