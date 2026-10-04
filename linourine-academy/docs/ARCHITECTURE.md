# بنية مشروع أكاديمية لينورين

## 1. القرارات التقنية

| الطبقة | الاختيار | السبب |
|---|---|---|
| الواجهة والخادم | Next.js (App Router) + TypeScript | SSR لـ SEO، وصفحات ثابتة سريعة للدورات، ومسارات API في نفس المشروع |
| التنسيق | Tailwind CSS مع متغيرات CSS للألوان | الألوان تُقرأ من إعدادات الإدارة (`theme.*`) |
| قاعدة البيانات | PostgreSQL عبر Supabase | علاقات واضحة، وRLS، ونسخ احتياطية جاهزة |
| المصادقة | Supabase Auth | تجزئة كلمات السر وإدارة الجلسات جاهزتان ومُختبرتان، ولا نكتبهما بأنفسنا |
| التخزين | Supabase Storage (bucket اسمه `media`) | رفع الصور مع قيود النوع والحجم |
| التحقق من المدخلات | Zod (في الخادم دائماً) | مصدر واحد للتحقق في النماذج وAPI |
| تحديد المعدل | Upstash Redis | حماية نموذج التسجيل والتواصل وتسجيل الدخول |
| الاستضافة | Vercel للتطبيق + Supabase للبيانات | GitHub Pages لا تشغّل Backend، لذلك نفصل الطبقات |

**ملاحظة عن الاستضافة**: التطبيق لا يعمل على GitHub Pages لأنه يحتاج خادماً. يُربط المستودع على GitHub بـ Vercel فيُنشر تلقائياً عند كل `push` على `main`.

## 2. هيكل المجلدات

```
linourine-academy/
├─ app/
│  ├─ (public)/                 # الموقع العام (RTL)
│  │  ├─ page.tsx               # الرئيسية
│  │  ├─ about/  services/  contact/  certificates/  workshops/  languages/
│  │  ├─ courses/
│  │  │  ├─ page.tsx            # قائمة الدورات + تصفية
│  │  │  └─ [slug]/page.tsx     # Landing Page الدورة + نموذج التسجيل
│  │  └─ blog/[slug]/
│  ├─ admin/                    # لوحة الإدارة (محمية)
│  │  ├─ login/
│  │  ├─ (dashboard)/           # layout واحد: Sidebar + Header
│  │  │  ├─ page.tsx            # Dashboard
│  │  │  ├─ courses/  categories/  services/  registrations/  messages/
│  │  │  ├─ pages/  landing-pages/  articles/  media/  trainers/
│  │  │  ├─ certificates/  faq/  testimonials/  settings/
│  │  │  └─ users/  roles/  audit-log/
│  ├─ api/
│  │  ├─ registrations/route.ts # نموذج التسجيل (عام، مع rate limit)
│  │  ├─ contact/route.ts
│  │  ├─ track/route.ts         # عدّاد الزيارات بدون كوكيز
│  │  └─ admin/...              # عمليات الإدارة (تتحقق من الصلاحية)
│  ├─ sitemap.ts  robots.ts  not-found.tsx  error.tsx  loading.tsx
├─ components/
│  ├─ ui/                       # Button, Input, Select, Modal, Badge, Toast, Table...
│  ├─ public/                   # Navbar, Footer, CourseCard, CourseHero, SectionRenderer
│  └─ admin/                    # AdminSidebar, AdminHeader, DataTable, SectionEditor
├─ lib/
│  ├─ supabase/                 # client.ts / server.ts / admin.ts (service role)
│  ├─ auth/                     # getSessionUser, requirePermission
│  ├─ validation/               # مخططات Zod (courses, registrations, sections...)
│  ├─ seo/                      # generateMetadata, JSON-LD (Organization, Course, Breadcrumb)
│  ├─ audit.ts                  # logAudit(actor, action, entity)
│  ├─ rate-limit.ts  hash.ts  sanitize.ts
├─ messages/ar.json             # نصوص الواجهة (جاهز لإضافة fr.json و en.json)
├─ types/                       # أنواع مولّدة من قاعدة البيانات
├─ supabase/
│  ├─ migrations/               # 0001_schema, 0002_rls, 0003_seed
│  └─ seed/create_super_admin.sql
├─ docs/ARCHITECTURE.md
├─ .env.example  .gitignore  README.md
```

## 3. مبدأ الأمان: ثلاث طبقات

1. **الوسيط (middleware)**: يمنع الوصول لأي مسار `/admin/*` بدون جلسة صالحة.
2. **الخادم**: كل عملية إدارة تستدعي `requirePermission('edit_courses')` قبل أي تعديل، وتتحقق من المدخلات بـ Zod.
3. **قاعدة البيانات (RLS)**: حتى لو وُجدت ثغرة في الكود، فسياسات الصفوف تمنع القراءة والكتابة غير المصرح بهما.

نقاط مهمة:
- الزائر **لا يكتب مباشرة** في قاعدة البيانات. طلب التسجيل ورسالة التواصل والزيارات تمر عبر API يستعمل `service role` بعد التحقق وتحديد المعدل وحقل فخ (honeypot).
- لا نخزن عنوان IP الخام، بل **تجزئة مملّحة** (`IP_HASH_SALT`).
- `SUPABASE_SERVICE_ROLE_KEY` لا يُستعمل إلا في ملفات الخادم (`lib/supabase/admin.ts`).
- من يملك `manage_roles` لا يستطيع منح دور `super_admin` (محمي في RLS).
- رفع الملفات: JPG/PNG/WEBP/SVG فقط، بحد 5 MB، مع تنظيف SVG من السكربتات، وتحويل الصور إلى WebP عند العرض.

## 4. نظام الأقسام (Landing Pages والصفحات)

كل قسم صف في `landing_page_sections` أو `page_sections` بحقلين: `type` و`content` (JSONB). كل نوع له مخطط Zod ومكوّن عرض ومحرر في الإدارة:

`hero` · `text` · `image` · `features` · `cards` · `testimonials` · `faq` · `cta` · `gallery` · `video` · `statistics`

الترتيب بالسحب والإفلات يحدّث `sort_order`، والإخفاء بـ `is_visible`. عند إنشاء دورة جديدة تُنشأ Landing Page افتراضية بالأقسام المطلوبة (نبذة، ماذا ستتعلم، لمن الدورة، البرنامج، المدرب، الشهادة، FAQ، CTA) ويعدّلها المدير بعد ذلك.

## 5. رحلة طلب التسجيل

```
الزائر في /courses/[slug]
  → النموذج (الدورة والولاية معبّأتان تلقائياً)
  → POST /api/registrations: Zod + honeypot + rate limit
  → INSERT في registration_requests (status = new)
  → trigger: لقطة لاسم الدورة + إشعار في الإدارة (Badge)
  → المدير يغيّر الحالة: جديد / قيد المراجعة / تم التواصل / مقبول / مرفوض / مؤجل
  → كل تغيير يُسجَّل في audit_logs
```

## 6. الأدوار

| الدور | الحدود |
|---|---|
| مدير عام (`super_admin`) | كل شيء، ومنح الصلاحيات وإزالتها |
| مسؤول (`admin`) | كل شيء ما عدا إدارة الأدوار وحذف المستخدمين |
| مدير (`manager`) | المحتوى والطلبات والرسائل، مع نشر الدورات |
| محرر (`editor`) | تعديل المحتوى فقط، بدون نشر الدورات ولا الطلبات |
| مشرف (`moderator`) | الطلبات والرسائل والتقييمات |

يمكن للمدير العام أيضاً تعديل صلاحيات مستخدم بعينه (`user_permissions`) دون تغيير دوره.

## 7. ترتيب التنفيذ

1. ✅ البنية ومخطط قاعدة البيانات والصلاحيات (هذه المرحلة)
2. المصادقة وحماية مسارات الإدارة
3. لوحة الإدارة: الهيكل ثم الدورات ثم الطلبات
4. الموقع العام ونظام الدورات وLanding Pages
5. نموذج التسجيل
6. SEO (Metadata, JSON-LD, sitemap)
7. الأمان والأداء والمراجعة النهائية
