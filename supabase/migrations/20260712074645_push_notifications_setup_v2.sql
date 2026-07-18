
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "usuarios veem suas inscricoes"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "usuarios criam suas inscricoes"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "usuarios removem suas inscricoes"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

select cron.schedule(
  'leve-send-reminders-daily',
  '0 18 * * *',
  $$
  select net.http_post(
    url:='https://tizvuzrhfjkovhhtxswc.supabase.co/functions/v1/send-reminders',
    headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret','88291bf30ca7dab691d518d6f2ed219c0ad29851dd07c8d6'),
    body:='{}'::jsonb
  );
  $$
);
