-- Create the FIRST Super Admin.
-- 1) Supabase Dashboard -> Authentication -> Users -> "Add user" (email + strong password, auto-confirm).
-- 2) Run this in the SQL Editor, replacing the email. Never commit real emails/passwords.
-- The SQL Editor runs as a privileged role, so it is the only place this can be executed.

insert into user_roles (user_id, role_id)
select p.id, r.id
from profiles p
join auth.users u on u.id = p.id
join roles r on r.key = 'super_admin'
where u.email = 'CHANGE_ME@example.com'
on conflict do nothing;

-- Verify
select u.email, r.key as role
from user_roles ur
join auth.users u on u.id = ur.user_id
join roles r on r.id = ur.role_id;
