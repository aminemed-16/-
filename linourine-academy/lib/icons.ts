import {
  Award, BookOpen, Briefcase, Globe, GraduationCap, Palette, Settings, TrendingUp,
  type LucideIcon,
} from 'lucide-react';

/** Maps `services.icon_key` (stored in the DB) to a real icon component. */
export const serviceIcons: Record<string, LucideIcon> = {
  'chart-up': TrendingUp, 'certificate': Award, 'gear': Settings, 'palette': Palette,
  'globe': Globe, 'book-open': BookOpen, 'graduation-cap': GraduationCap, 'briefcase': Briefcase,
};
export function ServiceIcon({ iconKey }: { iconKey: string | null }) {
  const Icon = (iconKey && serviceIcons[iconKey]) || GraduationCap;
  return <Icon size={22} aria-hidden />;
}
