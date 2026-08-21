import type { Request } from 'express';

/** Max |offset| accepted: 14h in minutes */
const MAX_TZ_OFFSET = 14 * 60;

/**
 * Browser/RN getTimezoneOffset(): minutes to add to local time to get UTC
 * (e.g. Spain UTC+2 → -120).
 */
export function parseTzOffset(raw: unknown): number {
  if (raw === undefined || raw === null || raw === '') return 0;
  const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(n) || Math.abs(n) > MAX_TZ_OFFSET) return 0;
  return Math.trunc(n);
}

export function getTzOffsetFromRequest(req: Request): number {
  const header = req.headers['x-timezone-offset'];
  const headerVal = Array.isArray(header) ? header[0] : header;
  return parseTzOffset(headerVal ?? req.query.tzOffset ?? (req.body as { tzOffset?: unknown })?.tzOffset);
}

/**
 * Start/end Instant covering one calendar day in the user's timezone.
 * dateString: YYYY-MM-DD in the user's local calendar; if omitted, "today" there.
 */
export function getCalendarDayRange(
  dateString?: string | null,
  tzOffsetMinutes = 0
): { start: Date; end: Date; year: number; month: number; day: number } {
  let year: number;
  let month: number;
  let day: number;

  if (dateString && /^\d{4}-\d{2}-\d{2}$/.test(String(dateString))) {
    const [y, m, d] = String(dateString).split('-').map(Number);
    year = y;
    month = m;
    day = d;
  } else {
    const localMs = Date.now() - tzOffsetMinutes * 60_000;
    const local = new Date(localMs);
    year = local.getUTCFullYear();
    month = local.getUTCMonth() + 1;
    day = local.getUTCDate();
  }

  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) + tzOffsetMinutes * 60_000);
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) + tzOffsetMinutes * 60_000);

  return { start, end, year, month, day };
}

/** YYYY-MM-DD of an instant in the user's local calendar */
export function toCalendarDateString(date: Date, tzOffsetMinutes = 0): string {
  const local = new Date(date.getTime() - tzOffsetMinutes * 60_000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Hour 0–23 in the user's local timezone */
export function getLocalHour(date: Date, tzOffsetMinutes = 0): number {
  const local = new Date(date.getTime() - tzOffsetMinutes * 60_000);
  return local.getUTCHours();
}

/** Local calendar components for an instant */
export function getLocalYmd(date: Date, tzOffsetMinutes = 0): { year: number; month: number; day: number } {
  const local = new Date(date.getTime() - tzOffsetMinutes * 60_000);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
  };
}
