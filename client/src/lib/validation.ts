export const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function validateName(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return "Name is required.";
  if (!NAME_PATTERN.test(trimmed))
    return "Only letters, numbers, hyphens, and underscores allowed.";
  return null;
}
