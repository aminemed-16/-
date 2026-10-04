-- LINOURINE ACADEMY — Row Level Security
-- Principles:
--   * Visitors can only READ published/visible content. They never write directly:
--     registration, contact and analytics go through the API (service role + validation + rate limit).
--   * Staff access is decided by has_permission(), never by role name alone.

-- ───────── Enable RLS everywhere ─────────
do $$
declare t text;
begin
  foreach t in array array['profiles','roles','permissions','role_permissions','user_roles','user_permissions',
    'media','course_categories','trainers','services','certificates','courses','course_media',
    'landing_pages','landing_page_sections','pages','page_sections','articles','faq','testimonials',
    'settings','social_links','registration_requests','contact_messages','notifications',
    'audit_logs','page_views'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ───────── Public read (published / visible only) ─────────
create policy public_read on courses            for select using (status = 'published');
create policy public_read on articles           for select using (status = 'published');
create policy public_read on pages              for select using (status = 'published');
create policy public_read on testimonials       for select using (status = 'published');
create policy public_read on course_categories  for select using (is_visible);
create policy public_read on trainers           for select using (is_visible);
create policy public_read on services           for select using (is_visible);
create policy public_read on certificates       for select using (is_visible);
create policy public_read on faq                for select using (is_visible);
create policy public_read on social_links       for select using (is_visible);
create policy public_read on settings           for select using (is_public);
create policy public_read on media              for select using (true);

create policy public_read on landing_pages for select using (status = 'published');
create policy public_read on landing_page_sections for select using (
  is_visible and exists (select 1 from landing_pages lp
                         where lp.id = landing_page_id and lp.status = 'published'));
create policy public_read on page_sections for select using (
  is_visible and exists (select 1 from pages p
                         where p.id = page_id and p.status = 'published'));
create policy public_read on course_media for select using (
  exists (select 1 from courses c where c.id = course_id and c.status = 'published'));

-- ───────── Staff: content tables (read = any staff, write = specific permission) ─────────
do $$
declare r record;
begin
  for r in select * from (values
    ('course_categories',     'manage_categories'),
    ('services',              'manage_services'),
    ('trainers',              'manage_trainers'),
    ('certificates',          'manage_certificates'),
    ('pages',                 'manage_pages'),
    ('page_sections',         'manage_pages'),
    ('landing_pages',         'manage_landing_pages'),
    ('landing_page_sections', 'manage_landing_pages'),
    ('articles',              'manage_articles'),
    ('faq',                   'manage_faq'),
    ('testimonials',          'manage_testimonials'),
    ('media',                 'manage_media'),
    ('social_links',          'manage_settings'),
    ('settings',              'manage_settings'),
    ('course_media',          'edit_courses')
  ) as v(tbl, perm) loop
    execute format('create policy staff_read  on %I for select using (public.is_staff())', r.tbl);
    execute format('create policy staff_write on %I for all
                    using (public.has_permission(%L)) with check (public.has_permission(%L))',
                   r.tbl, r.perm, r.perm);
  end loop;
end $$;

-- ───────── Courses: separate permission per action ─────────
create policy staff_read   on courses for select using (public.has_permission('view_courses'));
create policy staff_insert on courses for insert with check (public.has_permission('create_courses'));
create policy staff_update on courses for update
  using (public.has_permission('edit_courses')) with check (
    public.has_permission('edit_courses')
    -- changing status to/from 'published' needs the publish permission
    and (status <> 'published' or public.has_permission('publish_courses')));
create policy staff_delete on courses for delete using (public.has_permission('delete_courses'));

-- ───────── Registration requests & messages (no public insert: API only) ─────────
create policy staff_read   on registration_requests for select using (public.has_permission('view_orders'));
create policy staff_update on registration_requests for update
  using (public.has_permission('edit_orders')) with check (public.has_permission('edit_orders'));
create policy staff_delete on registration_requests for delete using (public.has_permission('delete_orders'));

create policy staff_read   on contact_messages for select using (public.has_permission('view_messages'));
create policy staff_update on contact_messages for update
  using (public.has_permission('manage_messages')) with check (public.has_permission('manage_messages'));
create policy staff_delete on contact_messages for delete using (public.has_permission('manage_messages'));

-- ───────── Notifications: visible only to people holding the required permission ─────────
create policy staff_read   on notifications for select using (public.has_permission(required_permission));
create policy staff_update on notifications for update
  using (public.has_permission(required_permission)) with check (public.has_permission(required_permission));

-- ───────── Audit log & analytics: read-only for staff, writes via service role ─────────
create policy staff_read on audit_logs for select using (public.has_permission('view_audit_logs'));
create policy staff_read on page_views for select using (public.has_permission('view_analytics'));

-- ───────── Users, roles, permissions ─────────
create policy own_or_staff_read on profiles for select
  using (id = auth.uid() or public.has_permission('view_users'));
create policy staff_update on profiles for update
  using (public.has_permission('edit_users')) with check (
    public.has_permission('edit_users')
    -- only a Super Admin may deactivate or edit another Super Admin
    and (public.is_super_admin() or not exists (
      select 1 from user_roles ur join roles r on r.id = ur.role_id
      where ur.user_id = profiles.id and r.key = 'super_admin')));

create policy staff_read on roles            for select using (public.is_staff());
create policy staff_read on permissions      for select using (public.is_staff());
create policy staff_read on role_permissions for select using (public.is_staff());
create policy own_or_manager_read on user_roles for select
  using (user_id = auth.uid() or public.has_permission('view_users'));
create policy own_or_manager_read on user_permissions for select
  using (user_id = auth.uid() or public.has_permission('view_users'));

-- Role/permission editing is reserved to Super Admin
create policy super_write on roles            for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_write on permissions      for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_write on role_permissions for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_write on user_permissions for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Assigning roles: manage_roles holders may assign any role EXCEPT super_admin (anti privilege escalation)
create policy manage_roles_write on user_roles for all
  using (public.is_super_admin() or (public.has_permission('manage_roles')
         and role_id <> (select id from roles where key = 'super_admin')))
  with check (public.is_super_admin() or (public.has_permission('manage_roles')
         and role_id <> (select id from roles where key = 'super_admin')));

-- ───────── Storage (bucket "media") ─────────
-- Create the bucket in the Supabase dashboard (public read), then:
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('media','media', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml'])
-- on conflict (id) do nothing;
-- create policy "staff upload media" on storage.objects for insert
--   with check (bucket_id = 'media' and public.has_permission('manage_media'));
-- create policy "staff delete media" on storage.objects for delete
--   using (bucket_id = 'media' and public.has_permission('manage_media'));
-- NOTE: SVG uploads must be sanitised server-side before storing (strip <script>, on* attributes).
