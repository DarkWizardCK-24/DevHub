/** Date helpers. API dates are ISO strings; date-only fields are "YYYY-MM-DD". */

/** Parse "YYYY-MM-DD" as a local date (new Date("2026-01-05") would be UTC midnight). */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDate(value: string | null | undefined, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  if (!value) return "";
  const date = value.length === 10 ? parseDateOnly(value) : new Date(value);
  return date.toLocaleDateString(undefined, options);
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function timeAgo(value: string): string {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "just now";
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 604_800) return rtf.format(Math.round(seconds / 86_400), "day");
  return formatDate(value, { month: "short", day: "numeric", year: "numeric" });
}

/** "Today", "Tomorrow", "3d overdue" or a short date, for due dates. */
export function dueLabel(value: string): { text: string; overdue: boolean; soon: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((parseDateOnly(value).getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { text: `${-days}d overdue`, overdue: true, soon: false };
  if (days === 0) return { text: "Today", overdue: false, soon: true };
  if (days === 1) return { text: "Tomorrow", overdue: false, soon: true };
  return { text: formatDate(value), overdue: false, soon: days <= 3 };
}

export function minutesLabel(minutes: number | null): string {
  if (minutes == null) return "";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
