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

## Onboarding e notificações

1. Execute `supabase/migrations/202607120001_onboarding_notifications.sql` no SQL Editor.
2. Publique a função: `supabase functions deploy process-notifications --no-verify-jwt`.
3. Configure os secrets: `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`.
   `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidos automaticamente à Edge Function.
4. Habilite `pg_cron` e `pg_net` e adapte o comando comentado ao final da migration com o project ref e o mesmo `CRON_SECRET`.

Para testar sem esperar dez minutos, altere apenas o job do usuário de teste:

```sql
update notification_history
set scheduled_at = now(), error_code = null
where user_id = 'UUID_DO_USUARIO' and notification_id = 'welcome-01';
```

Em seguida, invoque `process-notifications` com `Authorization: Bearer CRON_SECRET`.

### Instalação PWA e Momentos LEVE

Execute também, na sequência, a migration:

```text
supabase/migrations/202607130001_pwa_preferences.sql
```

Ela registra no perfil a apresentação do tutorial, a instalação detectada e o estado da permissão. A tabela `push_subscriptions` recebe a data da última validação da assinatura.

Para testar o iPhone no navegador e em modo instalado, use Safari e “Adicionar à Tela de Início”. Para testar Android, use Chrome em HTTPS; o evento de instalação só aparece quando os critérios nativos do navegador forem atendidos. Permissão de push e instalação não funcionam integralmente em HTTP fora de `localhost`.

### Três Momentos LEVE diários

Execute `supabase/migrations/202607130002_daily_moments.sql` depois das migrations anteriores e publique novamente `process-notifications`. O cron existente de um minuto cria, sem duplicar, manhã, tarde e noite para usuários com permissão concedida e assinatura validada.

Para antecipar testes, configure temporariamente o secret `ENABLE_NOTIFICATION_TEST_MODE=true` e invoque a função com o mesmo `CRON_SECRET` do cron:

```json
{
  "testNow": "2026-07-13T08:00:00-03:00",
  "testPeriod": "morning",
  "testUserId": "UUID_DO_USUARIO"
}
```

Use horários locais dentro das janelas: `08:00` para manhã, `13:30` para tarde e `20:30` para noite. Use sempre a data corrente em São Paulo. Desative o secret de teste ao terminar.
