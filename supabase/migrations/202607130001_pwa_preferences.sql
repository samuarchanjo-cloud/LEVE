-- Preferências do fluxo de instalação e permissão. Execute após 202607120001.
alter table public.profiles
  add column if not exists install_tutorial_dismissed_at timestamptz,
  add column if not exists pwa_installed_at timestamptz,
  add column if not exists notification_prompt_shown_at timestamptz,
  add column if not exists notification_permission text check(notification_permission in ('default','granted','denied')),
  add column if not exists notification_permission_granted_at timestamptz,
  add column if not exists notification_permission_denied_at timestamptz;

alter table public.push_subscriptions
  add column if not exists push_subscription_validated_at timestamptz;

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
