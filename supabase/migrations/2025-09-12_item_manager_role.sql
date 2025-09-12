-- Migration: Add 'item_manager' role and allow item managers to add/edit items
-- Safe to re-run.

-- 1) Update profiles.role CHECK constraint to include 'item_manager'
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'profiles'
      and constraint_name = 'profiles_role_check'
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member','leader','item_manager'));

-- 2) Helper function to check 'item_manager' role
create or replace function public.is_item_manager(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'item_manager'
  );
$$;

grant execute on function public.is_item_manager(uuid) to anon, authenticated;

-- 3) RLS policies on items to permit item managers to insert/update (not delete)
drop policy if exists "manage insert items" on public.items;
drop policy if exists "manage update items" on public.items;

create policy "manage insert items" on public.items for insert
  with check (public.is_item_manager(auth.uid()));

create policy "manage update items" on public.items for update
  using (public.is_item_manager(auth.uid()))
  with check (public.is_item_manager(auth.uid()));

