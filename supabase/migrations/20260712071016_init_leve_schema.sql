
-- profiles: 1 linha por usuario, criada automaticamente no cadastro
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  subscription_status text not null default 'trial' check (subscription_status in ('trial','active','expired','cancelled'))
);

alter table public.profiles enable row level security;

create policy "usuarios veem o proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "usuarios atualizam o proprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- cria o profile automaticamente quando alguem se cadastra no auth
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, trial_ends_at)
  values (new.id, new.email, now() + interval '7 days');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- diario leve: checklist diario dos 4 pilares
create table public.diario_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null default current_date,
  agua boolean not null default false,
  alimentacao_consciente boolean not null default false,
  movimento boolean not null default false,
  sono_regular boolean not null default false,
  gentileza boolean not null default false,
  nota_do_dia text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.diario_entries enable row level security;

create policy "usuarios veem seu proprio diario"
  on public.diario_entries for select
  using (auth.uid() = user_id);

create policy "usuarios criam seu proprio diario"
  on public.diario_entries for insert
  with check (auth.uid() = user_id);

create policy "usuarios atualizam seu proprio diario"
  on public.diario_entries for update
  using (auth.uid() = user_id);
