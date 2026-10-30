export const CATEGORIES = [
  "Exercise",
  "Faith",
  "Games",
  "Music",
  "Movie",
  "Sports",
  "Outing",
  "Craft",
  "Visitor",
  "Meeting",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type Location = { id: string; name: string; code: string; note: string };
export type Calendar = {
  id: string;
  name: string;
  subtitle: string;
  color: "wine" | "gold";
  theme: "classic" | "minimal";
  font: "sans" | "serif";
  visibility: "public" | "staff";
  locationIds: string[];
  footer: string;
  editorIds: string[];
  archived: boolean;
  order: number;
  showNotes: boolean;
  holidays: boolean;
  printMode: "month" | "large" | "week";
};
export type CalendarEvent = {
  id: string;
  calendarIds: string[];
  title: string;
  date: string;
  time: string;
  endTime: string;
  allDay: boolean;
  locationId: string;
  host: string;
  notes: string;
  featured: boolean;
  signUp: boolean;
  contact: string;
  category: Category;
  detail: string;
  banner: boolean;
  seriesId?: string;
  cancelled?: boolean;
  overrides: Record<string, { time?: string; locationId?: string }>;
};
export type Series = CalendarEvent & {
  rule: "weekly" | "interval" | "nth" | "custom";
  interval: number;
  weekdays: number[];
  nth: number;
  until: string;
  dates: string[];
  exceptions: Record<string, Partial<CalendarEvent>>;
};
export type DayNote = {
  id: string;
  date: string;
  calendarIds: string[];
  text: string;
  banner: boolean;
};
export type MonthState = {
  generated: boolean;
  status: "draft" | "published";
  headerImage: string;
  publishedHeaderImage?: string;
  snapshot: CalendarEvent[];
  notes: DayNote[];
};
export type CalendarDocument = {
  calendars: Calendar[];
  locations: Location[];
  events: CalendarEvent[];
  series: Series[];
  notes: DayNote[];
  months: Record<string, MonthState>;
  sourceNotes: string[];
};
export type Workspace = {
  document: CalendarDocument;
  version: number;
  role: string;
  userId: string;
  history: {
    id: number;
    summary: string;
    actorName: string;
    createdAt: string;
  }[];
  staff: { id: string; name: string }[];
};
export const EMPTY: CalendarDocument = {
  calendars: [],
  locations: [],
  events: [],
  series: [],
  notes: [],
  months: {},
  sourceNotes: [],
};
export const dateKey = (d: Date) => d.toISOString().slice(0, 10);
export const facilityToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const monthKey = (calendarId: string, month: string) =>
  `${calendarId}:${month}`;
export const isDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(Date.parse(s)) &&
  dateKey(new Date(`${s}T12:00:00Z`)) === s;
export const isMonth = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
export function daysInMonth(month: string) {
  if (!isMonth(month)) throw new Error("Invalid month");
  const [y, m] = month.split("-").map(Number);
  return Array.from(
    { length: new Date(Date.UTC(y, m, 0)).getUTCDate() },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  );
}
export function shiftMonth(month: string, amount: number) {
  const d = new Date(`${month}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + amount);
  return dateKey(d).slice(0, 7);
}
export function monthLabel(month: string) {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
export function timeLabel(time: string) {
  if (!time) return "All day";
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
export function matchesSeries(s: Series, date: string) {
  if (date < s.date || (s.until && date > s.until)) return false;
  if (s.rule === "custom") return s.dates.includes(date);
  const d = new Date(`${date}T12:00:00Z`);
  if (!s.weekdays.includes(d.getUTCDay())) return false;
  if (s.rule === "nth")
    return (
      Math.ceil(d.getUTCDate() / 7) === s.nth ||
      (s.nth === -1 &&
        d.getUTCDate() + 7 > daysInMonth(date.slice(0, 7)).length)
    );
  const start = new Date(`${s.date}T12:00:00Z`);
  const sunday = new Date(start);
  sunday.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const weeks = Math.floor((d.getTime() - sunday.getTime()) / 604800000);
  return s.rule !== "interval" || weeks % Math.max(1, s.interval) === 0;
}
export function occurrences(
  doc: CalendarDocument,
  month: string,
): CalendarEvent[] {
  const result = doc.events
    .filter((e) => e.date.startsWith(month))
    .map((e) => ({ ...e }));
  for (const s of doc.series)
    for (const date of daysInMonth(month)) {
      if (!matchesSeries(s, date)) continue;
      const ids = (s.exceptions[date]?.calendarIds ?? s.calendarIds).filter(
        (id) => doc.months[monthKey(id, month)]?.generated,
      );
      if (!ids.length) continue;
      const {
        rule,
        interval,
        weekdays,
        nth,
        until,
        dates,
        exceptions,
        ...base
      } = s;
      const e = {
        ...base,
        ...exceptions[date],
        id: `${s.id}@${date}`,
        seriesId: s.id,
        date,
        calendarIds: ids,
      };
      result.push(e);
    }
  return result.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.allDay ? "" : a.time).localeCompare(b.allDay ? "" : b.time) ||
      a.title.localeCompare(b.title),
  );
}
export function forCalendar(e: CalendarEvent, id: string): CalendarEvent {
  return { ...e, ...e.overrides[id] };
}
export function holidayNotes(month: string): DayNote[] {
  const year = Number(month.slice(0, 4));
  const fixed: Record<string, string> = {
    "01-01": "New Year’s Day",
    "06-19": "Juneteenth",
    "07-04": "Independence Day",
    "11-11": "Veterans Day",
    "12-25": "Christmas Day",
  };
  const nth: Record<string, [number, number, string]> = {
    "01": [1, 3, "Martin Luther King Jr. Day"],
    "02": [1, 3, "Presidents’ Day"],
    "05": [1, -1, "Memorial Day"],
    "09": [1, 1, "Labor Day"],
    "10": [1, 2, "Columbus Day"],
    "11": [4, 4, "Thanksgiving Day"],
  };
  return daysInMonth(month).flatMap((date) => {
    let text = fixed[date.slice(5)];
    const rule = nth[month.slice(5)];
    if (rule) {
      const d = new Date(`${date}T12:00:00Z`);
      const n = Math.ceil(d.getUTCDate() / 7);
      if (
        d.getUTCDay() === rule[0] &&
        (n === rule[1] ||
          (rule[1] === -1 && d.getUTCDate() + 7 > daysInMonth(month).length))
      )
        text = rule[2];
    }
    return text
      ? [
          {
            id: `holiday-${year}-${date}`,
            date,
            calendarIds: [],
            text,
            banner: false,
          },
        ]
      : [];
  });
}
export function notesFor(
  doc: CalendarDocument,
  calendar: Calendar,
  month: string,
) {
  if (!calendar.showNotes) return [];
  const notes = doc.notes.filter(
    (n) => n.date.startsWith(month) && n.calendarIds.includes(calendar.id),
  );
  return [
    ...notes,
    ...(calendar.holidays
      ? holidayNotes(month).filter(
          (h) => !notes.some((n) => n.date === h.date && n.text === h.text),
        )
      : []),
  ];
}
export function warnings(events: CalendarEvent[], calendarId: string) {
  const issues: string[] = [];
  const mine = events.filter(
    (e) => e.calendarIds.includes(calendarId) && !e.cancelled,
  );
  for (const date of [...new Set(mine.map((e) => e.date))]) {
    const count = mine.filter((e) => e.date === date).length;
    if (count > 8) issues.push(`${date}: ${count} entries — check print fit.`);
  }
  for (const a of mine)
    for (const b of events) {
      if (
        a.id === b.id ||
        b.cancelled ||
        a.date !== b.date ||
        a.allDay ||
        b.allDay
      )
        continue;
      for (const aid of a.calendarIds)
        for (const bid of b.calendarIds) {
          const av = forCalendar(a, aid),
            bv = forCalendar(b, bid);
          if (
            av.locationId &&
            av.locationId === bv.locationId &&
            av.time < (bv.endTime || addMinutes(bv.time, 1)) &&
            bv.time < (av.endTime || addMinutes(av.time, 1))
          ) {
            issues.push(
              `${a.date}: ${[a.title, b.title].sort().join(" / ")} use the same location at ${timeLabel([av.time, bv.time].sort()[0])}.`,
            );
          }
        }
    }
  return [...new Set(issues)];
}
function addMinutes(time: string, n: number) {
  const [h, m] = time.split(":").map(Number);
  return `${String(h + Math.floor((m + n) / 60)).padStart(2, "0")}:${String((m + n) % 60).padStart(2, "0")}`;
}
export function blankEvent(date: string, calendarId: string): CalendarEvent {
  return {
    id: "",
    calendarIds: [calendarId],
    title: "",
    date,
    time: "14:00",
    endTime: "",
    allDay: false,
    locationId: "",
    host: "",
    notes: "",
    featured: false,
    signUp: false,
    contact: "",
    category: "Games",
    detail: "",
    banner: false,
    overrides: {},
  };
}
