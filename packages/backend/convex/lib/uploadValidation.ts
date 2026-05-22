export const ALLOWED_IMAGE_MIME_TYPES: ReadonlyArray<string> = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const FREE_USER_STORAGE_BYTES = 500 * 1024 * 1024;
export const PREMIUM_USER_STORAGE_BYTES = 5 * 1024 * 1024 * 1024;
export const MAX_UPLOADS_PER_USER = 500;

export function normalizeContentType(
  contentType: string | undefined | null,
): string {
  if (!contentType) return "";
  return contentType.split(";")[0]!.trim().toLowerCase();
}

export function isAllowedImageMime(
  contentType: string | undefined | null,
): boolean {
  const normalized = normalizeContentType(contentType);
  return ALLOWED_IMAGE_MIME_TYPES.includes(normalized);
}

export function validateUploadMetadata(
  contentType: string | undefined | null,
  size: number | undefined | null,
): string | null {
  if (!isAllowedImageMime(contentType)) {
    return `disallowed_content_type:${normalizeContentType(contentType) || "empty"}`;
  }
  if (typeof size !== "number" || size <= 0) {
    return "missing_or_invalid_size";
  }
  if (size > MAX_UPLOAD_BYTES) {
    return `size_exceeds_limit:${size}`;
  }
  return null;
}

export function getUserStorageQuota(isPremium: boolean | undefined): number {
  return isPremium ? PREMIUM_USER_STORAGE_BYTES : FREE_USER_STORAGE_BYTES;
}
