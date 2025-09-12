-- Migration: allow leaders to delete profiles (idempotent)
-- Note: Deleting a profile does NOT delete auth.users; for full user removal,
-- use a server-side function with the service role to call the Admin API.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    drop policy if exists "profiles leader delete" on public.profiles;
    create policy "profiles leader delete" on public.profiles for delete
      using (public.is_leader(auth.uid()));
  end if;
end $$;

