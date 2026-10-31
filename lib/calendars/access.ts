import {
  EMPTY,
  type CalendarDocument,
  type CalendarEvent,
  type DayNote,
} from "./model";
import { CalendarInputError } from "./validation";

export function assertEdit(
  user: { id: string; role: string },
  doc: CalendarDocument,
  ids: string[],
) {
  if (
    !ids.length ||
    (user.role !== "admin" &&
      (user.role !== "editor" ||
        ids.some(
          (id) =>
            !doc.calendars
              .find((c) => c.id === id)
              ?.editorIds.includes(user.id),
        )))
  )
    throw new CalendarInputError(
      "You need editor permission on every calendar linked to this event",
    );
}
export function publicDocument(doc: CalendarDocument): CalendarDocument {
  const result = structuredClone(EMPTY);
  result.calendars = doc.calendars
    .filter((c) => c.visibility === "public" && !c.archived)
    .map((c) => ({ ...c, editorIds: [] }));
  const ids = new Set(result.calendars.map((c) => c.id));
  const events = new Map<string, CalendarEvent>(),
    notes = new Map<string, DayNote>();
  for (const [key, state] of Object.entries(doc.months)) {
    const id = key.split(":")[0];
    if (!ids.has(id) || state.status !== "published") continue;
    result.months[key] = {
      generated: false,
      status: "published",
      headerImage: state.publishedHeaderImage || "",
      snapshot: [],
      notes: [],
    };
    for (const n of state.notes) {
      const key = `${n.id}:${n.text}`;
      const old = notes.get(key);
      notes.set(key, {
        ...n,
        calendarIds: [...new Set([...(old?.calendarIds || []), id])],
      });
    }
    for (const e of state.snapshot) {
      const override = e.overrides[id] || {};
      const value = { ...e, ...override, calendarIds: [id], overrides: {} };
      const key = JSON.stringify([
        e.id,
        value.title,
        value.date,
        value.time,
        value.locationId,
        value.notes,
        value.detail,
        value.host,
        value.cancelled,
        value.endTime,
        value.signUp,
        value.contact,
        value.category,
        value.featured,
        value.banner,
        value.allDay,
      ]);
      const old = events.get(key);
      events.set(key, {
        ...value,
        id: old?.id || `${id}:${e.id}`,
        calendarIds: [...new Set([...(old?.calendarIds || []), id])],
      });
    }
  }
  result.events = [...events.values()];
  result.notes = [...notes.values()];
  result.locations = doc.locations
    .filter((l) => result.calendars.some((c) => c.locationIds.includes(l.id)))
    .map((l) => ({ ...l, note: "" }));
  return result;
}
