// Imports the Willow Lane December 2026 activity calendar (transcribed from
// "Willow December Draft Calendar.pdf") into the calendar workspace as a draft.
//
// Dry run (default): prints the resulting month and renders the PDF to check fit.
//   npx tsx --env-file=.env.local scripts/import-willow-december-2026.ts [pdf-out-dir]
// Apply: saves it, bumping the version and recording a History entry that can be
// restored from the admin calendar page.
//   npx tsx --env-file=.env.local scripts/import-willow-december-2026.ts --apply
//
// Recurring activities come from the existing weekly series (the month is marked
// generated). Dates that differ from the usual schedule use series exceptions.
// Willow-only series are cancelled directly; series shared with Healthcare only
// drop Willow from that date, so Healthcare's calendar is never changed.
import { writeFile } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { db, pool } from "../lib/db";
import { calendarHistory, calendarWorkspaces } from "../lib/db/schema";
import {
  blankEvent,
  monthKey,
  occurrences,
  timeLabel,
  warnings,
  type CalendarDocument,
  type CalendarEvent,
  type Category,
  type Series,
} from "../lib/calendars/model";
import { validateEvent } from "../lib/calendars/validation";
import { renderCalendarPdf } from "../lib/calendars/pdf";

const WORKSPACE = "ssc-activity-calendars";
const W = "willow";
const MONTH = "2026-12";
const date = (day: number) => `${MONTH}-${String(day).padStart(2, "0")}`;

export function importDecember(doc: CalendarDocument) {
  const key = monthKey(W, MONTH);
  if (
    doc.months[key]?.generated ||
    doc.events.some((e) => e.date.startsWith(MONTH) && e.calendarIds.includes(W))
  )
    throw new Error(
      "Willow Lane December 2026 already has activities. Clear the month first.",
    );

  doc.months[key] = {
    ...(doc.months[key] ?? { headerImage: "", snapshot: [], notes: [] }),
    generated: true,
    status: "draft",
  };

  const series = (title: string, weekday: number, time: string) => {
    const s = doc.series.find(
      (s) =>
        s.calendarIds.includes(W) &&
        s.title === title &&
        s.weekdays.includes(weekday) &&
        s.time === time,
    );
    if (!s) throw new Error(`Recurring series not found: ${title} (${weekday} ${time})`);
    return s;
  };
  // Takes Willow off one date of a series, leaving any other calendar as is.
  const skip = (s: Series, ...days: number[]) => {
    for (const day of days) {
      const others = s.calendarIds.filter((id) => id !== W);
      s.exceptions[date(day)] = others.length
        ? { ...s.exceptions[date(day)], calendarIds: others }
        : { calendarIds: [], cancelled: true };
    }
  };

  const dominoes = series("Dominoes", 4, "10:30");
  skip(dominoes, 3, 10, 17, 24, 31); // not on the December calendar
  skip(series("Bingo", 2, "14:00"), 8); // Pass the Present instead
  skip(series("Bingo", 4, "14:00"), 31);
  skip(series("Sheepshead", 4, "15:15"), 31);
  skip(series("Skip Bo", 3, "10:30"), 30);
  skip(series("Exercise", 5, "10:00"), 25);
  skip(series("Wii Bowling", 5, "10:30"), 25);
  // Retitled services: Willow gets its own entry, the shared series is untouched.
  skip(series("Catholic Mass", 3, "10:30"), 9, 23, 30);
  skip(series("Protestant Service", 4, "10:15"), 10, 17);

  let n = 0;
  const event = (
    day: number,
    time: string,
    title: string,
    locationId: string,
    category: Category,
    extra: Partial<CalendarEvent> = {},
  ) => {
    const [start, end = ""] = time.split("-");
    const value = validateEvent(
      {
        ...blankEvent(date(day), W),
        id: `willow-2026-12-${++n}`,
        time: start,
        endTime: end,
        allDay: !start,
        title,
        locationId,
        category,
        featured: true,
        ...extra,
      },
      doc,
    );
    doc.events.push(value);
  };
  const plain = { featured: false };
  const bus = {
    signUp: true,
    contact: "Sally or Melissa",
    notes: "Sign up with Sally or Melissa",
  };

  event(1, "18:30", "Jim Ohlschmidt & Steve Cohen Music & Happy Hour", "tol", "Music");
  event(2, "14:00", "Gingerbread House with Lisa from the Bookmobile", "gallery", "Craft");
  event(3, "18:30", "Sargento SECAP Singers", "gallery", "Music");
  event(4, "14:00", "Jesse & James Christmas Show", "tol", "Music");
  event(5, "09:45", "Richard’s School of Dance Christmas Showcase", "gallery", "Visitor");
  event(5, "14:00", "Caroling with Trinity Lutheran Church of Howards Grove", "tol", "Music");
  event(5, "18:30", "Movie", "lr", "Movie", { ...plain, detail: "I Can Only Imagine" });
  event(6, "14:00", "Bingo", "dr", "Games");
  event(7, "14:00", "Rick Gustafson & Co Music", "tol", "Music");
  event(7, "18:00", "Therapy Dog Visit", "", "Visitor", { detail: "Room to Room" });
  event(8, "14:00", "Pass the Present", "tol", "Games");
  event(8, "", "Making Spirits Bright Bus", "", "Outing", bus);
  event(9, "10:30", "Catholic Service", "tol", "Faith", plain);
  event(9, "14:00", "Golden Cordeliers Christmas Show", "gallery", "Music");
  event(10, "10:15", "Protestant Service & Communion", "tol", "Faith", {
    ...plain,
    host: "Pastor McKnight",
  });
  event(11, "13:30", "Movie & Popcorn", "", "Movie", { detail: "Arthur Christmas" });
  event(12, "11:00-11:30", "Northern Lights Christmas Performance", "gallery", "Music");
  event(12, "13:30", "Movie", "lr", "Movie", { ...plain, detail: "While You Were Sleeping" });
  event(14, "14:00", "Bill Bernico Music Requests", "tol", "Music");
  event(15, "10:30", "Christmas Cards Games", "lr", "Games", plain);
  event(15, "18:30", "Jukebox Diva Music & Happy Hour", "tol", "Music");
  event(16, "13:30", "Cookie Decorating", "dr", "Craft");
  event(16, "14:00", "Sheboygan Accordion Club", "gallery", "Music");
  event(17, "10:15", "Trinity Lutheran Service", "tol", "Faith", plain);
  event(17, "", "Making Spirits Bright Bus", "", "Outing", bus);
  event(18, "14:00", "Sharps & Flats Christmas Show", "gallery", "Music");
  event(18, "18:00", "Drive-in Movie", "gallery", "Movie");
  event(19, "10:00", "Coffee & Christmas Games", "cafe", "Games");
  event(19, "13:30", "Movie", "lr", "Movie", { ...plain, detail: "Last Holiday" });
  event(21, "14:00", "Cookie Contest Tasting & Judging", "gallery", "Craft");
  event(22, "18:30", "Movie & Popcorn", "tol", "Movie", { detail: "Elf" });
  event(23, "10:30", "Catholic Service", "tol", "Faith", plain);
  event(23, "", "Christmas Giving Tree Gift Giving", "lr", "Visitor", {
    ...plain,
    notes: "Afternoon",
  });
  event(24, "18:30", "Movie", "lr", "Movie", { detail: "The Santa Clause" });
  event(25, "", "Merry Christmas & Happy Holidays!", "", "Visitor", { banner: true });
  event(26, "13:30", "Movie", "lr", "Movie", { detail: "Michael" });
  event(30, "10:30", "Catholic Service", "tol", "Faith", plain);
  event(30, "13:30", "Resident Council", "lr", "Meeting");
  event(31, "14:00", "New Year’s Eve Happy Hour", "tol", "Music");

  // "Christmas" on the 25th comes from the calendar's automatic holiday notes.
  const notes: [number, string][] = [
    [2, "Bookmobile Day"],
    [4, "Hanukkah Begins"],
    [21, "Winter Begins"],
    [25, "Christmas movies in the Living Room. Just ask someone to play what you want."],
    [26, "Kwanzaa Begins"],
    [26, "Boxing Day"],
    [31, "New Year’s Eve"],
    ...[5, 12, 19, 26].map(
      (day) => [day, "Ask for a weekend activity packet."] as [number, string],
    ),
  ];
  notes.forEach(([day, text], i) =>
    doc.notes.push({
      id: `willow-2026-12-note-${i + 1}`,
      date: date(day),
      calendarIds: [W],
      text,
      banner: false,
    }),
  );
  return { events: n, notes: notes.length };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const out = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const [row] = await db
    .select()
    .from(calendarWorkspaces)
    .where(eq(calendarWorkspaces.id, WORKSPACE));
  if (!row) throw new Error("Calendar workspace not found");
  const before = row.document as CalendarDocument;
  const doc = structuredClone(before);
  const counts = importDecember(doc);

  const calendar = doc.calendars.find((c) => c.id === W)!;
  const month = occurrences(doc, MONTH).filter((e) => e.calendarIds.includes(W));
  let day = "";
  for (const e of month) {
    if (e.date !== day) console.log(`\n${(day = e.date)}`);
    console.log(
      `  ${e.allDay ? "        " : timeLabel(e.time).padStart(8)}  ${e.title}${e.host ? ` w/${e.host}` : ""}${e.detail ? ` (${e.detail})` : ""}${e.locationId ? ` - ${e.locationId}` : ""}`,
    );
  }
  const issues = warnings(occurrences(doc, MONTH), W);
  console.log(`\n${month.length} activities, ${counts.events} one-off, ${counts.notes} day notes`);
  if (issues.length) console.log("Warnings:\n  " + issues.join("\n  "));
  const pdf = await renderCalendarPdf(doc, MONTH, [calendar]);
  console.log(`PDF: ${pdf.pageCount} page, ${pdf.overflow.length} overflow`, pdf.overflow);
  if (pdf.overflow.length) throw new Error("December does not fit the monthly PDF");
  if (out) await writeFile(`${out}/willow-2026-12.pdf`, pdf.bytes);

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to save.");
    return;
  }
  const summary = "Imported Willow Lane December 2026 draft calendar";
  await db.transaction(async (tx) => {
    const saved = await tx
      .update(calendarWorkspaces)
      .set({ document: doc, version: row.version + 1, updatedAt: new Date() })
      .where(
        and(
          eq(calendarWorkspaces.id, WORKSPACE),
          eq(calendarWorkspaces.version, row.version),
        ),
      )
      .returning({ id: calendarWorkspaces.id });
    if (!saved.length) throw new Error("Calendar changed while importing; re-run.");
    await tx.insert(calendarHistory).values({
      workspaceId: WORKSPACE,
      userId: "calendar-import",
      actorName: "December import script",
      summary: `Before: ${summary}`,
      document: before,
      version: row.version,
    });
  });
  console.log(`Saved as version ${row.version + 1}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
