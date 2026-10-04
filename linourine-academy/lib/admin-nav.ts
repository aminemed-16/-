import {
  Award, Briefcase, FileText, GraduationCap, HelpCircle, Image as ImageIcon, Inbox, LayoutDashboard,
  LayoutTemplate, MessageSquare, Newspaper, ScrollText, Settings, ShieldCheck, Star, Tags, UserCog, Users,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { label: string; href: string; icon: LucideIcon; permission?: string; ready: boolean };
export type NavGroup = { title: string; items: NavItem[] };

/** `ready: false` items render as disabled until their page exists. */
export const adminNav: NavGroup[] = [
  { title: 'عام', items: [{ label: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard, ready: true }] },
  {
    title: 'التسجيل',
    items: [
      { label: 'طلبات التسجيل', href: '/admin/registrations', icon: Inbox, permission: 'view_orders', ready: true },
      { label: 'رسائل التواصل', href: '/admin/messages', icon: MessageSquare, permission: 'view_messages', ready: true },
    ],
  },
  {
    title: 'المحتوى',
    items: [
      { label: 'الدورات', href: '/admin/courses', icon: GraduationCap, permission: 'view_courses', ready: true },
      { label: 'التصنيفات', href: '/admin/categories', icon: Tags, permission: 'manage_categories', ready: false },
      { label: 'الخدمات', href: '/admin/services', icon: Briefcase, permission: 'manage_services', ready: false },
      { label: 'الصفحات', href: '/admin/pages', icon: FileText, permission: 'manage_pages', ready: false },
      { label: 'صفحات الهبوط', href: '/admin/landing-pages', icon: LayoutTemplate, permission: 'manage_landing_pages', ready: false },
      { label: 'المقالات والأخبار', href: '/admin/articles', icon: Newspaper, permission: 'manage_articles', ready: false },
      { label: 'المدربون', href: '/admin/trainers', icon: Users, permission: 'manage_trainers', ready: false },
      { label: 'الشهادات', href: '/admin/certificates', icon: Award, permission: 'manage_certificates', ready: false },
      { label: 'الأسئلة الشائعة', href: '/admin/faq', icon: HelpCircle, permission: 'manage_faq', ready: false },
      { label: 'التقييمات', href: '/admin/testimonials', icon: Star, permission: 'manage_testimonials', ready: false },
      { label: 'الصور والملفات', href: '/admin/media', icon: ImageIcon, permission: 'manage_media', ready: true },
    ],
  },
  {
    title: 'النظام',
    items: [
      { label: 'الإعدادات', href: '/admin/settings', icon: Settings, permission: 'manage_settings', ready: true },
      { label: 'المستخدمون', href: '/admin/users', icon: UserCog, permission: 'view_users', ready: false },
      { label: 'الأدوار والصلاحيات', href: '/admin/roles', icon: ShieldCheck, permission: 'manage_roles', ready: false },
      { label: 'سجل النشاطات', href: '/admin/audit-log', icon: ScrollText, permission: 'view_audit_logs', ready: false },
    ],
  },
];
