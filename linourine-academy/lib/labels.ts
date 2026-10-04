export const statusLabels = { draft: 'مسودة', published: 'منشورة', unpublished: 'غير منشورة' } as const;
export const levelLabels = {
  beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم', all_levels: 'كل المستويات',
} as const;
export const modeLabels = { onsite: 'حضوري', online: 'عن بعد', hybrid: 'مختلط' } as const;
export const registrationLabels = { open: 'التسجيل مفتوح', closed: 'التسجيل مغلق', soon: 'قريباً', full: 'اكتمل العدد' } as const;

export const requestStatusLabels = {
  new: 'جديد', in_review: 'قيد المراجعة', contacted: 'تم التواصل',
  accepted: 'مقبول', rejected: 'مرفوض', postponed: 'مؤجل',
} as const;
export const requestStatusTones = {
  new: 'accent', in_review: 'info', contacted: 'warning', accepted: 'success', rejected: 'danger', postponed: 'neutral',
} as const;
