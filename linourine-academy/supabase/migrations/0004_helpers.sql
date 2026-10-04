-- Returns the effective permission keys of the current user (role matrix + per-user overrides).
create or replace function public.my_permissions() returns text[]
language sql stable security definer set search_path = public as $$
  select case
    when not public.is_staff() then '{}'::text[]
    when public.is_super_admin() then (select coalesce(array_agg(key), '{}') from permissions)
    else (
      select coalesce(array_agg(pm.key), '{}') from permissions pm
      where coalesce(
        (select up.granted from user_permissions up
          where up.user_id = auth.uid() and up.permission_id = pm.id),
        exists (select 1 from user_roles ur
          join role_permissions rp on rp.role_id = ur.role_id
          where ur.user_id = auth.uid() and rp.permission_id = pm.id)))
  end;
$$;
grant execute on function public.my_permissions() to authenticated;
