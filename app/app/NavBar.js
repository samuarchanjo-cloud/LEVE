'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS=[['/app','⌂','Inicio'],['/app/exercicios','⌁','Exercicios'],['/app/diario','▣','Diario'],['/app/receitas','♧','Receitas'],['/app/progresso','♙','Perfil']]
export default function NavBar(){
  const pathname=usePathname()
  return <nav className="navbar" aria-label="Navegacao principal">{ITEMS.map(([href,icon,label])=><Link key={href} href={href} className={pathname===href?'active':''}><span className="nav-icon">{icon}</span>{label}</Link>)}</nav>
}
