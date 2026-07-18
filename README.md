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

1. Execute `supabase/migrations/20260713030907_onboarding_notifications.sql` no SQL Editor.
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
supabase/migrations/20260713040603_pwa_preferences.sql
```

Ela registra no perfil a apresentação do tutorial, a instalação detectada e o estado da permissão. A tabela `push_subscriptions` recebe a data da última validação da assinatura.

Para testar o iPhone no navegador e em modo instalado, use Safari e “Adicionar à Tela de Início”. Para testar Android, use Chrome em HTTPS; o evento de instalação só aparece quando os critérios nativos do navegador forem atendidos. Permissão de push e instalação não funcionam integralmente em HTTP fora de `localhost`.

### Três Momentos LEVE diários

Execute `supabase/migrations/20260713062742_daily_moments.sql` e depois `supabase/migrations/20260713195400_generate_daily_moments_cron.sql`. A função `generate-daily-moments` cria, sem duplicar, manhã, tarde e noite para usuários com permissão concedida e assinatura validada. `process-notifications` apenas processa a fila a cada minuto.

Antes da migration do cron, crie um valor aleatório e salve o mesmo valor no Vault e nos secrets da Edge Function:

```sql
select vault.create_secret(
  'VALOR_ALEATORIO_FORTE',
  'generate_daily_moments_cron_secret',
  'Autenticação do cron dos três Momentos LEVE'
);
select vault.create_secret(
  'OUTRO_VALOR_ALEATORIO_FORTE',
  'process_notifications_cron_secret',
  'Autenticação do processador de notificações'
);
```

```bash
supabase secrets set GENERATE_DAILY_MOMENTS_CRON_SECRET=VALOR_ALEATORIO_FORTE
supabase secrets set CRON_SECRET=OUTRO_VALOR_ALEATORIO_FORTE
supabase functions deploy generate-daily-moments --no-verify-jwt
supabase functions deploy process-notifications --no-verify-jwt
supabase db push
```

O cron `generate-daily-moments-daily` roda de hora em hora entre 09:00 e 12:00 UTC (06:00–09:00 em São Paulo). As repetições são idempotentes. O job legado `leve-send-reminders-daily` é removido e `process-notifications-every-minute` continua a cada minuto, recriado com o segredo lido do Vault.

Validação dos três períodos do dia atual em São Paulo:

```sql
select user_id, schedule_date, period, notification_id, message_id, category,
       scheduled_at at time zone 'America/Sao_Paulo' as horario_sao_paulo,
       target_url, choice_reason, sent_at, error_code, suppression_reason
from public.notification_history
where schedule_date = (now() at time zone 'America/Sao_Paulo')::date
  and period in ('morning','afternoon','evening')
order by user_id, scheduled_at;
```

Para antecipar um teste sem mudar as janelas reais no código, gere primeiro os registros e ajuste somente o usuário/data de teste:

```sql
update public.notification_history
set scheduled_at = now(), sent_at = null, error_code = null, suppression_reason = null
where user_id = 'UUID_DO_USUARIO'
  and schedule_date = (now() at time zone 'America/Sao_Paulo')::date
  and period = 'morning'; -- troque pelo período em teste
```

Use `ENABLE_NOTIFICATION_TEST_MODE=true` e `testNow` dentro da janela do período ao invocar `process-notifications`. Para restaurar os horários determinísticos reais, apague somente os três registros ainda não enviados do usuário/data de teste e invoque novamente `generate-daily-moments`; a função os recriará dentro das janelas oficiais.

Para antecipar testes, configure temporariamente o secret `ENABLE_NOTIFICATION_TEST_MODE=true` e invoque a função com o mesmo `CRON_SECRET` do cron:

```json
{
  "testNow": "2026-07-13T08:00:00-03:00",
  "testPeriod": "morning",
  "testUserId": "UUID_DO_USUARIO"
}
```

Use horários locais dentro das janelas: `08:00` para `morning`, `13:30` para `afternoon` e `20:30` para `evening`. Use sempre a data corrente em São Paulo. Desative o secret de teste ao terminar.
