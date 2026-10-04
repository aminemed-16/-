import { z } from 'zod';

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] as const;
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB, matches the storage bucket limit

export const mediaUploadSchema = z.object({
  altText: z.string().trim().max(200).optional().default(''),
});

/**
 * Strips the main SVG attack surface server-side before the file is stored:
 * <script> tags, event-handler attributes (onload, onclick, ...), and javascript: URIs.
 * This is a defence-in-depth filter, not a full sanitizer — the bucket also disables SVG
 * script execution via Content-Type/CSP, but we never trust a single layer alone.
 */
export function sanitizeSvg(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export function safeFileExt(mime: string) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg' }[mime] ?? 'bin';
}
