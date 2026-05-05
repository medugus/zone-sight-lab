create type public.app_role as enum ('Admin','Consultant Microbiologist','Medical Laboratory Scientist','Quality Officer','Viewer');

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.app_role not null default 'Viewer',
  department text,
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create or replace function public.current_user_role() returns public.app_role language sql stable as $$
  select role from public.user_profiles where user_id = auth.uid()
$$;

create policy "profiles_self_or_admin_read" on public.user_profiles for select using (
  user_id = auth.uid() or public.current_user_role() = 'Admin'
);

create policy "profiles_admin_manage" on public.user_profiles for all using (
  public.current_user_role() = 'Admin'
) with check (
  public.current_user_role() = 'Admin'
);
