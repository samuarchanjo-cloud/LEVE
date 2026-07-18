-- Metadados e idempotência dos três Momentos LEVE diários.
alter table public.notification_history
  add column if not exists message_id text,
  add column if not exists period text check(period in ('morning','afternoon','evening')),
  add column if not exists schedule_date date,
  add column if not exists choice_reason text,
  add column if not exists suppression_reason text;

create unique index if not exists notification_history_daily_moment_once
  on public.notification_history(user_id, notification_id)
  where notification_id like 'daily-%';

create index if not exists notification_history_daily_schedule
  on public.notification_history(schedule_date, period, scheduled_at)
  where sent_at is null and error_code is null;
