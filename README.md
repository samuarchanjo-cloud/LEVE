# App LEVE

Código-fonte do App LEVE (PWA em Next.js), igual ao que está publicado em
produção: https://leve-app-six.vercel.app

## Rodar localmente

Pré-requisitos: [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).

```bash
npm install
npm run dev
```

Depois abra http://localhost:3000 no navegador.

O app já vem conectado ao banco de dados de produção no Supabase (a chave
pública fica em `lib/supabaseClient.js`), então cadastro, login, diário,
receitas e exercícios funcionam normalmente rodando local — é o mesmo banco
usado pelo app publicado.

## Estrutura

- `app/` — páginas do Next.js (App Router)
  - `app/login` — cadastro e login
  - `app/app` — área logada: dashboard (Diário LEVE, progresso de peso),
    `exercicios` (plano de 21 dias) e `receitas` (Receitas Interativas)
  - `app/app/perfil` — formulário de onboarding de saúde
- `lib/` — cliente Supabase, dados das receitas e do plano de exercícios
- `public/` — ícones, imagens das receitas, manifest do PWA e service worker

## Publicar uma alteração

Este projeto está publicado na Vercel (projeto `leve-app`). Depois de editar
o código aqui, peça para eu reenviar (redeploy) para que a alteração vá ao ar
— ou publique você mesmo via `vercel --prod` caso tenha a CLI da Vercel
instalada e configurada com acesso ao projeto.

## Banco de dados (Supabase)

Projeto Supabase: `leve`. Tabelas principais: `profiles` (perfil do usuário,
inclui dados de saúde e meta de peso), `diario_entries` (checklist diário) e
`push_subscriptions` (notificações push). Alterações de schema são feitas via
migrations no Supabase, não neste repositório.
