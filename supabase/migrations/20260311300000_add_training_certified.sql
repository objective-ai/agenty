alter table public.profiles
  add column if not exists training_certified boolean not null default false;
