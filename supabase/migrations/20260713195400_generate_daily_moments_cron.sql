-- Separa a geração diária do envio e padroniza o terceiro período como evening.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

do $$
declare constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.notification_history'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%period%'
  loop
    execute format('alter table public.notification_history drop constraint %I', constraint_record.conname);
  end loop;
end $$;

update public.notification_history
set period = 'evening',
    notification_id = replace(notification_id, 'daily-night-', 'daily-evening-'),
    message_id = replace(message_id, 'night-', 'evening-')
where period = 'night';

alter table public.notification_history
  add constraint notification_history_period_check
  check (period is null or period in ('morning','afternoon','evening'));

do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'generate_daily_moments_cron_secret'
      and nullif(decrypted_secret, '') is not null
  ) then
    raise exception 'Crie o segredo generate_daily_moments_cron_secret no Supabase Vault antes de aplicar esta migration';
  end if;
  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'process_notifications_cron_secret'
      and nullif(decrypted_secret, '') is not null
  ) then
    raise exception 'Crie o segredo process_notifications_cron_secret no Supabase Vault antes de aplicar esta migration';
  end if;
end $$;

do $$
declare job_record record;
begin
  -- send-reminders não existe neste código e era o produtor legado das notificações.
  for job_record in
    select jobid from cron.job
    where jobname in (
      'leve-send-reminders-daily',
      'generate-daily-moments-daily',
      'process-notifications-every-minute'
    )
  loop
    perform cron.unschedule(job_record.jobid);
  end loop;
end $$;

-- 09:00–12:00 UTC = 06:00–09:00 em America/Sao_Paulo.
-- As quatro tentativas são seguras porque notification_history possui índice único.
select cron.schedule(
  'generate-daily-moments-daily',
  '0 9-12 * * *',
  $job$
    select net.http_post(
      url := 'https://tizvuzrhfjkovhhtxswc.supabase.co/functions/v1/generate-daily-moments',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'generate_daily_moments_cron_secret'
          limit 1
        )
      ),
      body := '{}'::jsonb
    );
  $job$
);

-- Mantém a frequência de um minuto, substituindo qualquer segredo exposto por Vault.
select cron.schedule(
  'process-notifications-every-minute',
  '* * * * *',
  $job$
    select net.http_post(
      url := 'https://tizvuzrhfjkovhhtxswc.supabase.co/functions/v1/process-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'process_notifications_cron_secret'
          limit 1
        )
      ),
      body := '{}'::jsonb
    );
  $job$
);
