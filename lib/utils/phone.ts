export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("380") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+38${digits}`;
  return `+${digits}`;
}

export function isValidUkrPhone(phone: string): boolean {
  return /^\+380\d{9}$/.test(phone);
}
