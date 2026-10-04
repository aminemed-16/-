-- LINOURINE ACADEMY — initial data (safe to re-run)

-- ───────── Roles ─────────
insert into roles (key, name_ar, description, is_system) values
  ('super_admin', 'مدير عام',  'تحكم كامل في كل شيء، بما فيه الأدوار والصلاحيات', true),
  ('admin',       'مسؤول',     'تحكم شبه كامل، دون إدارة الأدوار أو حذف المستخدمين', true),
  ('manager',     'مدير',      'إدارة المحتوى والطلبات والرسائل', true),
  ('editor',      'محرر',      'تعديل المحتوى فقط، دون نشر الدورات', true),
  ('moderator',   'مشرف',      'إدارة الطلبات والرسائل والتقييمات', true)
on conflict (key) do nothing;

-- ───────── Permissions ─────────
insert into permissions (key, group_key, name_ar) values
  ('view_courses',        'courses',  'عرض الدورات'),
  ('create_courses',      'courses',  'إنشاء دورات'),
  ('edit_courses',        'courses',  'تعديل الدورات'),
  ('delete_courses',      'courses',  'حذف الدورات'),
  ('publish_courses',     'courses',  'نشر الدورات'),
  ('manage_categories',   'courses',  'إدارة التصنيفات'),
  ('manage_trainers',     'courses',  'إدارة المدربين'),
  ('manage_certificates', 'courses',  'إدارة الشهادات'),
  ('view_orders',         'orders',   'عرض طلبات التسجيل'),
  ('edit_orders',         'orders',   'تعديل طلبات التسجيل'),
  ('delete_orders',       'orders',   'حذف طلبات التسجيل'),
  ('view_messages',       'orders',   'عرض رسائل التواصل'),
  ('manage_messages',     'orders',   'إدارة رسائل التواصل'),
  ('manage_services',     'content',  'إدارة الخدمات'),
  ('manage_pages',        'content',  'إدارة الصفحات'),
  ('manage_landing_pages','content',  'إدارة صفحات الهبوط'),
  ('manage_articles',     'content',  'إدارة المقالات والأخبار'),
  ('manage_faq',          'content',  'إدارة الأسئلة الشائعة'),
  ('manage_testimonials', 'content',  'إدارة التقييمات'),
  ('manage_media',        'content',  'إدارة الصور والملفات'),
  ('manage_seo',          'content',  'إدارة SEO'),
  ('view_users',          'users',    'عرض المستخدمين'),
  ('create_users',        'users',    'إنشاء مستخدمين'),
  ('edit_users',          'users',    'تعديل المستخدمين'),
  ('delete_users',        'users',    'حذف المستخدمين'),
  ('manage_roles',        'users',    'إدارة الأدوار والصلاحيات'),
  ('manage_settings',     'system',   'إدارة الإعدادات العامة'),
  ('view_audit_logs',     'system',   'عرض سجل النشاطات'),
  ('view_analytics',      'system',   'عرض الإحصائيات')
on conflict (key) do nothing;

-- ───────── Role → permission matrix ─────────
-- super_admin needs no rows: is_super_admin() bypasses the matrix.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where (r.key = 'admin' and p.key not in ('manage_roles', 'delete_users'))
   or (r.key = 'manager' and p.key in (
        'view_courses','create_courses','edit_courses','publish_courses','manage_categories',
        'manage_trainers','manage_certificates','view_orders','edit_orders','view_messages',
        'manage_messages','manage_services','manage_pages','manage_landing_pages','manage_articles',
        'manage_faq','manage_testimonials','manage_media','view_analytics'))
   or (r.key = 'editor' and p.key in (
        'view_courses','create_courses','edit_courses','manage_categories','manage_trainers',
        'manage_certificates','manage_services','manage_pages','manage_landing_pages',
        'manage_articles','manage_faq','manage_testimonials','manage_media'))
   or (r.key = 'moderator' and p.key in (
        'view_courses','view_orders','edit_orders','view_messages','manage_messages','manage_testimonials'))
on conflict do nothing;

-- ───────── Settings (editable from Admin → Settings) ─────────
-- Values come from the academy flyer; empty ones are left for the owner to fill in.
insert into settings (key, value, is_public) values
  ('site.name',            '"أكاديمية لينورين"', true),
  ('site.name_latin',      '"LINOURINE ACADEMY"', true),
  ('site.tagline',         '"تعلم اليوم .. اصنع مستقبلك غداً"', true),
  ('site.description',     '""', true),
  ('site.logo_media_id',   'null', true),
  ('site.favicon_media_id','null', true),
  ('site.locale',          '"ar"', true),
  ('contact.phone',        '"0551 77 87 17"', true),
  ('contact.whatsapp',     '""', true),
  ('contact.email',        '""', true),
  ('contact.address',      '"فيلاج برالي - غليزان، الطريق المؤدي إلى السكة الحديدية، بجانب محل بيع المستلزمات الكهربائية"', true),
  ('contact.maps_url',     '""', true),
  ('registration.default_wilaya', '"غليزان"', true),
  ('footer.about',         '""', true),
  ('footer.copyright',     '"© أكاديمية لينورين. جميع الحقوق محفوظة."', true),
  ('theme.primary',        '"#1B2A6B"', true),
  ('theme.secondary',      '"#2D5BD0"', true),
  ('theme.accent',         '"#E6338E"', true),
  ('seo.default_title',    '"أكاديمية لينورين | تعليم متميز في غليزان"', true),
  ('seo.default_description','""', true),
  ('analytics.ga_id',      '""', true),
  ('analytics.meta_pixel_id','""', true),
  ('stats.students',       'null', true),
  ('stats.courses',        'null', true),
  ('stats.trainers',       'null', true),
  ('stats.certificates',   'null', true),
  ('about.vision',         '""', true),
  ('about.mission',        '""', true),
  ('about.goals',          '[]', true),
  ('about.values',         '[]', true),
  ('about.strengths',      '[{"title":"بيئة عصرية","text":"تعليم متميز في أجواء محفزة"},
                            {"title":"مجموعات صغيرة","text":"متابعة شخصية وفعالة"},
                            {"title":"برامج متطورة","text":"مواكبة لأحدث المناهج"},
                            {"title":"أساتذة ذوو كفاءة","text":"خبرة وكفاءة عالية"}]', true)
on conflict (key) do nothing;

-- ───────── Services (from the flyer; fully editable) ─────────
insert into services (title, description, icon_key, sort_order)
select * from (values
  ('برامج متطورة',   'مناهج حديثة وتطوير مستمر',                          'chart-up',  1),
  ('شهادات معتمدة',  'شهادات معتمدة ومعترف بها',                           'certificate', 2),
  ('التعليم التقني', 'تكوين مهني وتقني متخصص وعصري',                       'gear',      3),
  ('ورشات فنية',     'رسم، موسيقى، فنون وإبداع',                           'palette',   4),
  ('تعليم اللغات',   'فرنسية، إنجليزية، ألمانية، إسبانية، تركية',          'globe',     5),
  ('دروس الدعم',     'لكل المستويات وفي جميع المواد',                      'book-open', 6),
  ('دورات تكوينية',  'تكوين عملي وشهادات معتمدة',                          'graduation-cap', 7)
) as v(title, description, icon_key, sort_order)
where not exists (select 1 from services);

-- ───────── Social links ─────────
insert into social_links (platform, url, sort_order)
select * from (values
  ('facebook',  'https://www.facebook.com/linourine.academy/', 1),
  ('instagram', 'https://www.instagram.com/linourine_academy/', 2)
) as v(platform, url, sort_order)
where not exists (select 1 from social_links);

-- ───────── Core pages (content is edited through sections) ─────────
insert into pages (slug, title, status) values
  ('home',    'الرئيسية', 'published'),
  ('about',   'من نحن',   'published'),
  ('contact', 'تواصل معنا', 'published')
on conflict (slug) do nothing;

insert into page_sections (page_id, type, content, sort_order)
select p.id, 'hero',
       '{"title":"تعلم اليوم .. اصنع مستقبلك غداً","subtitle":"","primary_cta":{"label":"اكتشف الدورات","href":"/courses"},"secondary_cta":{"label":"سجل الآن","href":"/courses"},"image_media_id":null}'::jsonb,
       1
from pages p
where p.slug = 'home' and not exists (select 1 from page_sections ps where ps.page_id = p.id);
