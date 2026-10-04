-- Editors must be able to fix a typo in a published course, but only publishers may change publication state.
-- Replaces the earlier UPDATE policy (which blocked ANY update of a published row) with a trigger guard.

drop policy if exists staff_update on courses;
create policy staff_update on courses for update
  using (public.has_permission('edit_courses'))
  with check (public.has_permission('edit_courses'));

create or replace function public.guard_course_publish() returns trigger
language plpgsql as $$
begin
  if auth.uid() is null then return new; end if;           -- service role / maintenance scripts
  if tg_op = 'INSERT' then
    if new.status = 'published' and not public.has_permission('publish_courses') then
      raise exception 'publish permission required' using errcode = '42501';
    end if;
  elsif new.status is distinct from old.status
        and 'published' in (new.status::text, old.status::text)
        and not public.has_permission('publish_courses') then
    raise exception 'publish permission required' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists guard_course_publish on courses;
create trigger guard_course_publish before insert or update on courses
  for each row execute function public.guard_course_publish();
