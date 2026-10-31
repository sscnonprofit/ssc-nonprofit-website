import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  calendarHistory,
  calendarWorkspaces,
  user as users,
} from "@/lib/db/schema";
import { getSessionUser, type SessionUser } from "@/lib/cms/auth-helpers";
import {
  forCalendar,
  isDate,
  isMonth,
  monthKey,
  notesFor,
  occurrences,
  shiftMonth,
  type CalendarDocument,
  type CalendarEvent,
  type Workspace,
} from "./model";
import {
  CalendarInputError,
  text,
  validateCalendar,
  validateEvent,
  validateSeries,
} from "./validation";
import { publicDocument, assertEdit } from "./access";
export { publicDocument, assertEdit } from "./access";

const WORKSPACE = "ssc-activity-calendars";
export async function readStore() {
  const [row] = await db
    .select()
    .from(calendarWorkspaces)
    .where(eq(calendarWorkspaces.id, WORKSPACE));
  if (!row)
    throw new CalendarInputError("Calendar storage has not been initialized");
  return { ...row, document: row.document as CalendarDocument };
}
export async function staffSession() {
  const user = await getSessionUser();
  if (!user || !["admin", "editor", "viewer"].includes(user.role))
    throw new CalendarInputError("Sign in to access staff calendars");
  return user;
}
export async function adminWorkspace(): Promise<Workspace> {
  const user = await staffSession();
  const row = await readStore();
  const history =
    user.role === "admin"
      ? await db
          .select({
            id: calendarHistory.id,
            summary: calendarHistory.summary,
            actorName: calendarHistory.actorName,
            createdAt: calendarHistory.createdAt,
          })
          .from(calendarHistory)
          .where(eq(calendarHistory.workspaceId, WORKSPACE))
          .orderBy(desc(calendarHistory.id))
          .limit(40)
      : [];
  const staff =
    user.role === "admin"
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.disabled, false))
      : [];
  return {
    document: row.document,
    version: row.version,
    role: user.role,
    userId: user.id,
    history: history.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
    staff,
  };
}
export async function publishedWorkspace() {
  return publicDocument((await readStore()).document);
}
function admin(user: SessionUser) {
  if (user.role !== "admin")
    throw new CalendarInputError(
      "Only admins can manage settings, publish or restore history",
    );
}
export type CalendarAction = {
  action: string;
  version: number;
  calendarId?: string;
  month?: string;
  data?: unknown;
  scope?: string;
  id?: string;
};
export async function mutateWorkspace(input: CalendarAction) {
  const actor = await staffSession();
  const row = await readStore();
  if (!Number.isInteger(input.version) || input.version !== row.version)
    throw new CalendarInputError(
      "Another staff member changed this calendar. Reload before saving.",
    );
  const doc = structuredClone(row.document);
  const id = text(input.calendarId || "", 100);
  const month = input.month || "";
  const calendar = doc.calendars.find((c) => c.id === id);
  const needMonth = () => {
    if (!calendar || !isMonth(month))
      throw new CalendarInputError("Choose a calendar and valid month");
    return calendar;
  };
  let summary = input.action;
  switch (input.action) {
    case "event": {
      const e = validateEvent(input.data, doc);
      const old = e.seriesId
        ? occurrences(
            doc,
            e.id.split("@")[1]?.slice(0, 7) || e.date.slice(0, 7),
          ).find((v) => v.id === e.id)
        : doc.events.find((v) => v.id === e.id);
      if (e.id && !old)
        throw new CalendarInputError("Event not found; reload the month");
      assertEdit(actor, doc, [
        ...new Set([...e.calendarIds, ...(old?.calendarIds || [])]),
      ]);
      const raw = input.data as typeof e & { recurrence?: unknown };
      if (e.seriesId) {
        const s = doc.series.find((s) => s.id === e.seriesId);
        if (!s) throw new CalendarInputError("Series not found");
        assertEdit(actor, doc, s.calendarIds);
        if (input.scope === "series" || input.scope === "following") {
          const following = input.scope === "following";
          const updated = validateSeries(
            {
              ...s,
              ...e,
              ...(raw.recurrence || {}),
              id: s.id,
              date: following ? e.date : s.date,
            },
            doc,
          );
          if (following) {
            const before = new Date(`${e.date}T12:00:00Z`);
            before.setUTCDate(before.getUTCDate() - 1);
            s.until = before.toISOString().slice(0, 10);
            updated.id = crypto.randomUUID();
            updated.seriesId = undefined;
            updated.exceptions = Object.fromEntries(
              Object.entries(s.exceptions).filter(([date]) => date > e.date),
            );
            doc.series.push(updated);
          } else Object.assign(s, updated, { exceptions: s.exceptions });
        } else {
          const originalDate = e.id.split("@")[1];
          if (!isDate(originalDate))
            throw new CalendarInputError("Invalid occurrence");
          if (e.date !== originalDate) {
            s.exceptions[originalDate] = { calendarIds: [], cancelled: true };
            doc.events.push({
              ...e,
              id: crypto.randomUUID(),
              seriesId: undefined,
            });
          } else s.exceptions[originalDate] = { ...e };
        }
      } else if (raw.recurrence) {
        if (old) doc.events = doc.events.filter((v) => v.id !== old.id);
        const s = validateSeries(
          { ...e, ...(raw.recurrence as object), id: crypto.randomUUID() },
          doc,
        );
        doc.series.push(s);
        for (const cid of s.calendarIds)
          doc.months[monthKey(cid, e.date.slice(0, 7))] ||= {
            generated: true,
            status: "draft",
            headerImage: "",
            snapshot: [],
            notes: [],
          };
      } else {
        const value = { ...e, id: e.id || crypto.randomUUID() };
        const index = doc.events.findIndex((v) => v.id === e.id);
        if (index < 0) doc.events.push(value);
        else doc.events[index] = value;
      }
      summary = `Saved ${e.title}`;
      break;
    }
    case "delete": {
      const eventId = text(input.id, 150);
      const series = doc.series.find((s) => eventId.startsWith(`${s.id}@`));
      if (series) {
        assertEdit(actor, doc, series.calendarIds);
        series.exceptions[eventId.split("@")[1]] = {
          calendarIds: [],
          cancelled: true,
        };
      } else {
        const e = doc.events.find((e) => e.id === eventId);
        if (!e) throw new CalendarInputError("Event not found");
        assertEdit(actor, doc, e.calendarIds);
        doc.events = doc.events.filter((v) => v.id !== eventId);
      }
      summary = "Removed an occurrence";
      break;
    }
    case "calendar": {
      admin(actor);
      const value = validateCalendar(input.data, doc);
      const index = doc.calendars.findIndex((c) => c.id === value.id);
      if (index < 0) doc.calendars.push({ ...value, id: crypto.randomUUID() });
      else doc.calendars[index] = value;
      summary = `Updated calendar settings: ${value.name}`;
      break;
    }
    case "clone": {
      admin(actor);
      if (!calendar) throw new CalendarInputError("Calendar not found");
      const clone = {
        ...calendar,
        id: crypto.randomUUID(),
        name: `${calendar.name} copy`,
        editorIds: [],
        visibility: "staff" as const,
        order: doc.calendars.length,
        archived: false,
      };
      doc.calendars.push(clone);
      for (const s of [...doc.series])
        if (s.calendarIds.includes(id))
          doc.series.push({
            ...s,
            ...forCalendar(s, id),
            id: crypto.randomUUID(),
            calendarIds: [clone.id],
            overrides: {},
            exceptions: {},
          });
      summary = `Cloned ${calendar.name} and recurring schedule`;
      break;
    }
    case "reorder": {
      admin(actor);
      const ids = input.data as string[];
      if (
        !Array.isArray(ids) ||
        ids.length !== doc.calendars.length ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !doc.calendars.some((c) => c.id === id))
      )
        throw new CalendarInputError("Invalid calendar order");
      doc.calendars.forEach((c) => {
        c.order = ids.indexOf(c.id);
      });
      summary = "Reordered calendars";
      break;
    }
    case "location": {
      admin(actor);
      const data = input.data as {
        id: string;
        name: string;
        code: string;
        note: string;
      };
      const value = {
        id: text(data.id || "", 100) || crypto.randomUUID(),
        name: text(data.name, 160),
        code: text(data.code, 30),
        note: text(data.note, 250),
      };
      if (!value.name || !value.code)
        throw new CalendarInputError("Location name and code are required");
      const index = doc.locations.findIndex((l) => l.id === value.id);
      if (index < 0) doc.locations.push(value);
      else doc.locations[index] = value;
      summary = `Updated location ${value.code}`;
      break;
    }
    case "month": {
      needMonth();
      assertEdit(actor, doc, [id]);
      const data = input.data as {
        publish?: boolean;
        unpublish?: boolean;
        generate?: boolean;
        headerImage?: string;
      };
      const state = (doc.months[monthKey(id, month)] ||= {
        generated: false,
        status: "draft",
        headerImage: "",
        snapshot: [],
        notes: [],
      });
      if (data.headerImage !== undefined) {
        const url = text(data.headerImage, 1500);
        if (
          url &&
          !url.startsWith("/images/") &&
          !/^https:\/\/[^\s]+\.(png|jpe?g)(\?[^\s]*)?$/i.test(url)
        )
          throw new CalendarInputError(
            "Use a public HTTPS PNG/JPEG image URL or a local /images/ path",
          );
        state.headerImage = url;
      }
      if (data.generate) state.generated = true;
      if (data.publish || data.unpublish) {
        admin(actor);
        state.status = data.publish ? "published" : "draft";
        if (data.publish) {
          state.publishedHeaderImage = state.headerImage;
          state.snapshot = occurrences(doc, month).filter((e) =>
            e.calendarIds.includes(id),
          );
          state.notes = notesFor(doc, calendar!, month);
        }
      }
      summary = `${data.publish ? "Published" : data.unpublish ? "Unpublished" : data.generate ? "Generated" : "Updated"} ${calendar!.name}, ${month}`;
      break;
    }
    case "copyPrevious": {
      needMonth();
      assertEdit(actor, doc, [id]);
      const previous = shiftMonth(month, -1);
      for (const e of doc.events.filter(
        (e) =>
          e.calendarIds.includes(id) &&
          e.date.startsWith(previous) &&
          !e.seriesId,
      )) {
        const date = `${month}${e.date.slice(7)}`;
        if (isDate(date))
          doc.events.push({
            ...e,
            id: crypto.randomUUID(),
            date,
            calendarIds: [id],
            overrides: {},
          });
      }
      summary = `Copied previous month’s one-off events to ${month}`;
      break;
    }
    case "bulk": {
      const list = input.data as unknown[];
      if (!Array.isArray(list) || !list.length || list.length > 200)
        throw new CalendarInputError("Import 1–200 events at a time");
      const values = list.map((raw) => validateEvent(raw, doc));
      for (const e of values) assertEdit(actor, doc, e.calendarIds);
      doc.events.push(
        ...values.map((e) => ({
          ...e,
          id: crypto.randomUUID(),
          seriesId: undefined,
        })),
      );
      summary = `Imported ${values.length} events after preview`;
      break;
    }
    case "note": {
      needMonth();
      assertEdit(actor, doc, [id]);
      const n = input.data as {
        id?: string;
        date: string;
        text: string;
        banner: boolean;
      };
      if (!isDate(n.date) || !n.date.startsWith(month))
        throw new CalendarInputError("Choose a date in this month");
      const value = {
        id: crypto.randomUUID(),
        date: n.date,
        calendarIds: [id],
        text: text(n.text, 300),
        banner: !!n.banner,
      };
      if (!value.text) throw new CalendarInputError("Note text is required");
      doc.notes.push(value);
      summary = `Added day note on ${n.date}`;
      break;
    }
    case "restore": {
      admin(actor);
      const historyId = Number(input.id);
      if (!Number.isInteger(historyId))
        throw new CalendarInputError("Invalid revision");
      const [revision] = await db
        .select()
        .from(calendarHistory)
        .where(
          and(
            eq(calendarHistory.id, historyId),
            eq(calendarHistory.workspaceId, WORKSPACE),
          ),
        );
      if (!revision) throw new CalendarInputError("Revision not found");
      Object.assign(doc, revision.document);
      summary = `Restored revision ${historyId}`;
      break;
    }
    default:
      throw new CalendarInputError("Unknown calendar operation");
  }
  await db.transaction(async (tx) => {
    const saved = await tx
      .update(calendarWorkspaces)
      .set({ document: doc, version: row.version + 1, updatedAt: new Date() })
      .where(
        and(
          eq(calendarWorkspaces.id, WORKSPACE),
          eq(calendarWorkspaces.userId, row.userId),
          eq(calendarWorkspaces.version, input.version),
        ),
      )
      .returning({ id: calendarWorkspaces.id });
    if (!saved.length)
      throw new CalendarInputError(
        "Another staff member saved first. Reload before saving.",
      );
    await tx.insert(calendarHistory).values({
      workspaceId: WORKSPACE,
      userId: actor.id,
      actorName: actor.name,
      summary: `Before: ${summary}`,
      document: row.document,
      version: row.version,
    });
  });
  return adminWorkspace();
}
