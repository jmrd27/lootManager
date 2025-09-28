-- Allow leaders to directly set a user password when no email recovery is available.
create or replace function public.admin_set_password(target_user uuid, new_password text)
returns void
language plpgsql
security definer
set search_path = auth, public, extensions
as $$
begin
  if not public.is_leader(auth.uid()) then
    raise exception 'insufficient_privileges' using message = 'Leader role required.';
  end if;
  if new_password is null or char_length(new_password) < 8 then
    raise exception 'invalid_password' using message = 'Password must be at least 8 characters.';
  end if;

  update auth.users
  set
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  where id = target_user;

  if not found then
    raise exception 'user_not_found' using message = 'User not found.';
  end if;
end;
$$;

do $$
begin
  execute 'revoke all on function public.admin_set_password(uuid, text) from public';
exception when undefined_function then
  null;
end $$;

grant execute on function public.admin_set_password(uuid, text) to authenticated;
