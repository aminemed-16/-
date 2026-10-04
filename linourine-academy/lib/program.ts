export type ProgramModule = { title: string; items: string[] };

/** Plain-text editing format: module title on the first line, its items below, blank line between modules. */
export function programToText(modules: unknown): string {
  if (!Array.isArray(modules)) return '';
  return (modules as ProgramModule[]).map((m) => [m.title, ...(m.items ?? [])].join('\n')).join('\n\n');
}
