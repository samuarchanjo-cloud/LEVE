
alter table public.profiles
  add column if not exists nome text,
  add column if not exists idade integer,
  add column if not exists altura_cm integer,
  add column if not exists peso_inicial_kg numeric,
  add column if not exists peso_atual_kg numeric,
  add column if not exists peso_meta_kg numeric,
  add column if not exists alergias text,
  add column if not exists intolerante_lactose boolean not null default false,
  add column if not exists diabetico boolean not null default false,
  add column if not exists hipertenso boolean not null default false,
  add column if not exists onboarding_completo boolean not null default false;
