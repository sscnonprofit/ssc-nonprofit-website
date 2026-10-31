import {
  CATEGORIES,
  isDate,
  type CalendarDocument,
  type CalendarEvent,
  type Calendar,
  type Series,
} from "./model";

import { DEFAULT_APPEARANCE } from "./appearance";
import type { CalendarAppearance } from "./model";

export class CalendarInputError extends Error {}

export function validateAppearance(raw: unknown): CalendarAppearance {
  if (raw === undefined) return { ...DEFAULT_APPEARANCE };
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new CalendarInputError("Invalid appearance settings");
  const a = { ...DEFAULT_APPEARANCE, ...raw } as CalendarAppearance;
  if (
    typeof a.accentColor !== "string" ||
    (a.accentColor !== "" && !/^#[0-9a-f]{6}$/i.test(a.accentColor)) ||
    !Number.isInteger(a.fontSize) || a.fontSize < 14 || a.fontSize > 20 ||
    !["compact", "comfortable", "spacious"].includes(a.density) ||
    ![0, 1].includes(a.weekStartsOn) ||
    !["left", "center"].includes(a.headerAlign) ||
    [a.shadeWeekends, a.gridLines, a.showLocation, a.showEventDetails].some((v) => typeof v !== "boolean")
  ) throw new CalendarInputError("Invalid appearance settings");
  return {
    accentColor: a.accentColor.toLowerCase(), fontSize: a.fontSize,
    density: a.density, weekStartsOn: a.weekStartsOn,
    shadeWeekends: a.shadeWeekends, gridLines: a.gridLines,
    showLocation: a.showLocation, showEventDetails: a.showEventDetails,
    headerAlign: a.headerAlign,
  };
}

export function text(value: unknown, max = 300): string {
  if (typeof value !== "string" || value.length > max)
    throw new CalendarInputError(`Text must be at most ${max} characters`);
  return value.trim();
}
function strings(v: unknown, max = 50): string[] {
  if (
    !Array.isArray(v) ||
    v.length > max ||
    v.some((x) => typeof x !== "string" || x.length > 100)
  )
    throw new CalendarInputError("Invalid selection");
  return [...new Set(v)];
}
function time(v: unknown) {
  const s = text(v, 5);
  if (s && !/^([01]\d|2[0-3]):[0-5]\d$/.test(s))
    throw new CalendarInputError("Invalid time");
  return s;
}
export function validateEvent(
  raw: unknown,
  doc: CalendarDocument,
): CalendarEvent {
  const e = raw as CalendarEvent;
  if (!e || typeof e !== "object")
    throw new CalendarInputError("Invalid event");
  const ids = strings(e.calendarIds);
  if (
    !ids.length ||
    ids.some((id) => !doc.calendars.some((c) => c.id === id && !c.archived))
  )
    throw new CalendarInputError("Select an active calendar");
  if (!isDate(e.date)) throw new CalendarInputError("Enter a valid date");
  const title = text(e.title, 180);
  if (!title) throw new CalendarInputError("Title is required");
  if (!CATEGORIES.includes(e.category))
    throw new CalendarInputError("Choose a category");
  const start = time(e.time),
    end = time(e.endTime);
  if (!e.allDay && !start)
    throw new CalendarInputError("Start time is required");
  if (end && start && end <= start)
    throw new CalendarInputError("End time must follow start time");
  const locationId = text(e.locationId, 100);
  const overrides: CalendarEvent["overrides"] = {};
  for (const id of ids) {
    const o = e.overrides?.[id];
    if (o)
      overrides[id] = {
        time: o.time === undefined ? undefined : time(o.time),
        locationId:
          o.locationId === undefined ? undefined : text(o.locationId, 100),
      };
    const loc = overrides[id]?.locationId ?? locationId;
    if (
      loc &&
      !doc.calendars.find((c) => c.id === id)?.locationIds.includes(loc)
    )
      throw new CalendarInputError(
        "Location must be enabled on each selected calendar; use a location override when needed",
      );
    if (end && overrides[id]?.time && end <= overrides[id].time!)
      throw new CalendarInputError(
        "End time must follow overridden start time",
      );
  }
  return {
    id: text(e.id || "", 150),
    calendarIds: ids,
    title,
    date: e.date,
    time: start,
    endTime: end,
    allDay: !!e.allDay,
    locationId,
    host: text(e.host, 160),
    notes: text(e.notes, 800),
    featured: !!e.featured,
    signUp: !!e.signUp,
    contact: text(e.contact, 200),
    category: e.category,
    detail: text(e.detail, 250),
    banner: !!e.banner,
    overrides,
    cancelled: !!e.cancelled,
    ...(e.seriesId ? { seriesId: text(e.seriesId, 150) } : {}),
  };
}
export function validateSeries(raw: unknown, doc: CalendarDocument): Series {
  const s = raw as Series;
  const e = validateEvent(s, doc);
  if (!["weekly", "interval", "nth", "custom"].includes(s.rule))
    throw new CalendarInputError("Invalid recurrence");
  if (
    !Array.isArray(s.weekdays) ||
    s.weekdays.some((n) => !Number.isInteger(n) || n < 0 || n > 6) ||
    !s.weekdays.length
  )
    throw new CalendarInputError("Choose weekdays");
  if (s.until && (!isDate(s.until) || s.until < s.date))
    throw new CalendarInputError("Invalid series end date");
  if (!Number.isInteger(s.interval) || s.interval < 1 || s.interval > 52)
    throw new CalendarInputError("Interval must be 1–52 weeks");
  if (![-1, 1, 2, 3, 4, 5].includes(s.nth))
    throw new CalendarInputError("Invalid weekday occurrence");
  const dates = strings(s.dates, 366)
    .map((d) => d.trim())
    .filter(Boolean);
  if (s.rule === "custom" && !dates.length)
    throw new CalendarInputError("Add at least one custom date");
  if (dates.some((d) => !isDate(d)))
    throw new CalendarInputError("Invalid custom date");
  return {
    ...e,
    rule: s.rule,
    interval: s.interval,
    weekdays: s.weekdays,
    nth: s.nth,
    until: s.until || "",
    dates,
    exceptions: {},
  };
}
export function validateCalendar(
  raw: unknown,
  doc: CalendarDocument,
): Calendar {
  const c = raw as Calendar;
  const name = text(c.name, 100);
  if (!name) throw new CalendarInputError("Calendar name is required");
  const locationIds = strings(c.locationIds);
  if (locationIds.some((id) => !doc.locations.some((l) => l.id === id)))
    throw new CalendarInputError("Unknown location");
  if (
    !["wine", "gold"].includes(c.color) ||
    !["sans", "serif"].includes(c.font) ||
    !["classic", "minimal"].includes(c.theme) ||
    !["public", "staff"].includes(c.visibility) ||
    !["month", "large", "week"].includes(c.printMode)
  )
    throw new CalendarInputError("Invalid calendar settings");
  return {
    id: text(c.id || "", 100),
    name,
    subtitle: text(c.subtitle, 150),
    color: c.color,
    theme: c.theme,
    font: c.font,
    visibility: c.visibility,
    locationIds,
    editorIds: strings(c.editorIds, 100),
    footer: text(c.footer, 400),
    archived: !!c.archived,
    order: Number.isInteger(c.order) ? c.order : doc.calendars.length,
    showNotes: !!c.showNotes,
    holidays: !!c.holidays,
    printMode: c.printMode,
    appearance: validateAppearance(c.appearance),
  };
}
