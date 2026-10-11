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

/** Every timestamp in the app is shown in Indian Standard Time (IST, UTC+05:30), whatever the viewer's device or server clock says. */
export const APP_TIMEZONE = "Asia/Kolkata";
export const APP_TIMEZONE_LABEL = "IST";

export function formatDate(value: string | null | undefined, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  if (!value) return "";
  // Date-only values ("YYYY-MM-DD") are calendar days, not instants, so they are not shifted.
  if (value.length === 10) return parseDateOnly(value).toLocaleDateString(undefined, options);
  return new Date(value).toLocaleDateString(undefined, { ...options, timeZone: APP_TIMEZONE });
}

/** "11 Oct 2026, 10:55:39 pm IST" */
export function formatDateTime(value: string | null | undefined, withSeconds = true): string {
  if (!value) return "";
  const text = new Date(value).toLocaleString("en-IN", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
  });
  return `${text} ${APP_TIMEZONE_LABEL}`;
}

/** "10:55 pm IST" */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const text = new Date(value).toLocaleTimeString("en-IN", { timeZone: APP_TIMEZONE, hour: "numeric", minute: "2-digit" });
  return `${text} ${APP_TIMEZONE_LABEL}`;
}

/** Calendar day in IST as "YYYY-MM-DD" (used to group items by day). */
export function istDayKey(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

/** "Today", "Yesterday" or a long date, judged on the IST calendar. */
export function istDayLabel(value: string): string {
  const key = istDayKey(value);
  const now = Date.now();
  if (key === istDayKey(now)) return "Today";
  if (key === istDayKey(now - 86_400_000)) return "Yesterday";
  return new Date(value).toLocaleDateString("en-IN", { timeZone: APP_TIMEZONE, weekday: "long", month: "long", day: "numeric" });
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
