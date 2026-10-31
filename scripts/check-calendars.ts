import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { novemberSeed } from "../lib/calendars/seed";
import {
  blankEvent,
  daysInMonth,
  forCalendar,
  matchesSeries,
  monthKey,
  occurrences,
  warnings,
} from "../lib/calendars/model";
import { publicDocument, assertEdit } from "../lib/calendars/access";
import { validateAppearance, validateCalendar, validateEvent } from "../lib/calendars/validation";
import { DEFAULT_APPEARANCE, calendarAppearance, calendarWeekdays, contrastText } from "../lib/calendars/appearance";
import { renderCalendarPdf } from "../lib/calendars/pdf";
import { createIcs } from "../lib/calendars/ics";

async function main() {
  const doc = novemberSeed();
  const events = occurrences(doc, "2026-11");
  assert.deepEqual(calendarAppearance(doc.calendars[0]), DEFAULT_APPEARANCE);
  assert.deepEqual(validateAppearance(undefined), DEFAULT_APPEARANCE);
  assert.equal(calendarWeekdays(1)[0], "Monday");
  assert.equal(calendarWeekdays(1)[6], "Sunday");
  assert.equal(contrastText("#ffffff"), "#262626");
  assert.equal(contrastText("#123456"), "#ffffff");
  for (const invalid of [null, [], { accentColor: "url(javascript:alert(1))" }, { fontSize: 100 }, { fontSize: 13 }, { density: "unknown" }, { weekStartsOn: 2 }, { gridLines: "false" }, { showLocation: null }, { headerAlign: "right" }]) {
    assert.throws(() => validateAppearance(invalid));
  }
  const customCalendar = validateCalendar({ ...doc.calendars[0], appearance: { ...DEFAULT_APPEARANCE, accentColor: "#ABCDEF", fontSize: 20, density: "spacious", weekStartsOn: 1, shadeWeekends: true, gridLines: false, showLocation: false, showEventDetails: false, headerAlign: "center" } }, doc);
  assert.equal(customCalendar.appearance?.accentColor, "#abcdef");
  assert.equal(customCalendar.appearance?.showLocation, false);
  const customPdf = await renderCalendarPdf(doc, "2026-11", [customCalendar], "week");
  assert.equal(customPdf.pageCount, 6, "Monday-start November 2026 spans six weeks");
  assert.equal(customPdf.overflow.length, 0);
  assert.ok(customPdf.bytes.length > 0);
  assert.equal(daysInMonth("2026-11").length, 30);
  assert.equal(new Date("2026-11-01T12:00:00Z").getUTCDay(), 0);
  assert.equal(
    events.filter((e) => e.date === "2026-11-03" && e.title === "No Exercise")
      .length,
    1,
  );
  assert.equal(
    events.filter(
      (e) =>
        e.date === "2026-11-26" &&
        [
          "Exercise",
          "Sheepshead",
          "Bingo",
          "Dominoes",
          "Protestant Service",
        ].includes(e.title),
    ).length,
    0,
  );
  assert.ok(events.every((e) => !("exceptions" in e)));
  const craft = events.find(
    (e) => e.title === "Drop-in Craft with North High Students",
  )!;
  assert.equal(craft.calendarIds.length, 2);
  assert.equal(forCalendar(craft, "willow").time, "14:30");
  assert.equal(forCalendar(craft, "healthcare").time, "14:00");
  const shared = doc.events.find((e) => e.calendarIds.length === 2)!;
  doc.calendars[0].editorIds = ["editor-one"];
  assert.doesNotThrow(() =>
    assertEdit({ id: "editor-one", role: "editor" }, doc, ["willow"]),
  );
  assert.throws(() =>
    assertEdit({ id: "editor-one", role: "editor" }, doc, [
      "willow",
      "healthcare",
    ]),
  );
  assert.throws(() =>
    assertEdit({ id: "editor-one", role: "viewer" }, doc, ["willow"]),
  );
  assert.doesNotThrow(() =>
    assertEdit({ id: "admin", role: "admin" }, doc, ["willow", "healthcare"]),
  );
  const publishedTitle = shared.title;
  shared.title = "PRIVATE DRAFT TITLE";
  assert.ok(
    !publicDocument(doc).events.some((e) => e.title === "PRIVATE DRAFT TITLE"),
  );
  shared.title = publishedTitle;
  doc.months[monthKey("willow", "2026-11")].headerImage =
    "https://unpublished.example/image.png";
  assert.equal(
    publicDocument(doc).months[monthKey("willow", "2026-11")].headerImage,
    "",
  );
  doc.months[monthKey("willow", "2026-11")].headerImage = "";
  const publicDoc = publicDocument(doc);
  assert.ok(publicDoc.events.some((e) => e.calendarIds.length === 2));
  assert.equal(publicDoc.series.length, 0);
  assert.equal(publicDoc.sourceNotes.length, 0);
  doc.calendars[1].visibility = "staff";
  assert.ok(!publicDocument(doc).calendars.some((c) => c.id === "healthcare"));
  assert.ok(
    publicDocument(doc).events.every(
      (e) => !e.calendarIds.includes("healthcare"),
    ),
  );
  doc.calendars[1].visibility = "public";
  doc.months[monthKey("willow", "2026-11")].status = "draft";
  assert.ok(
    publicDocument(doc).events.every((e) => !e.calendarIds.includes("willow")),
  );
  doc.months[monthKey("willow", "2026-11")].status = "published";
  assert.throws(() =>
    validateEvent(
      {
        ...blankEvent("2026-11-01", "willow"),
        title: "Invalid time",
        time: "25:00",
      },
      doc,
    ),
  );
  assert.throws(() =>
    validateEvent(
      {
        ...blankEvent("2026-11-01", "willow"),
        title: "Invalid location",
        locationId: "oak",
      },
      doc,
    ),
  );
  const base = doc.series[0];
  assert.equal(
    matchesSeries(
      {
        ...base,
        rule: "interval",
        date: "2026-11-01",
        weekdays: [0],
        interval: 2,
      },
      "2026-11-08",
    ),
    false,
  );
  assert.equal(
    matchesSeries(
      {
        ...base,
        rule: "interval",
        date: "2026-11-01",
        weekdays: [0],
        interval: 2,
      },
      "2026-11-15",
    ),
    true,
  );
  assert.equal(
    matchesSeries(
      { ...base, rule: "nth", weekdays: [4], nth: 4 },
      "2026-11-26",
    ),
    true,
  );
  assert.equal(
    matchesSeries(
      { ...base, rule: "custom", dates: ["2026-11-17"] },
      "2026-11-17",
    ),
    true,
  );
  assert.equal(
    matchesSeries({ ...base, until: "2026-11-10" }, "2026-11-15"),
    false,
  );
  const collision = {
    ...blankEvent("2026-11-01", "willow"),
    id: "a",
    title: "A",
    time: "10:00",
    endTime: "11:00",
    locationId: "tol",
  };
  assert.ok(
    warnings(
      [
        collision,
        {
          ...collision,
          id: "b",
          time: "10:30",
          title: "B",
          calendarIds: ["healthcare"],
        },
      ],
      "willow",
    ).some((s) => s.includes("same location")),
  );
  const ics = createIcs(
    publicDoc,
    doc.calendars[0],
    1,
    new Date("2026-10-30T12:00:00Z"),
  );
  assert.ok(ics.includes("TZID:America/Chicago"));
  assert.ok(ics.includes("BEGIN:VEVENT"));
  assert.ok(ics.split("\r\n").every((line) => Buffer.byteLength(line) <= 75));
  const output = process.argv[2];
  for (const calendar of doc.calendars) {
    const result = await renderCalendarPdf(doc, "2026-11", [calendar]);
    console.log(
      `${calendar.name}: ${result.pageCount} page; ${result.overflow.length} overflow; ${result.warnings.length} small-text warnings`,
    );
    if (result.overflow.length) console.log(result.overflow);
    assert.equal(
      result.overflow.length,
      0,
      "Monthly PDF must fit every seeded entry",
    );
    const pdf = await PDFDocument.load(result.bytes);
    assert.equal(pdf.getPageCount(), 1);
    assert.equal(pdf.getPages()[0].getWidth(), 792);
    assert.equal(pdf.getPages()[0].getHeight(), 612);
    if (output)
      await writeFile(
        `${output}/november-2026-${calendar.id}.pdf`,
        result.bytes,
      );
  }
  const weekly = await renderCalendarPdf(doc, "2026-11", doc.calendars, "week");
  assert.equal(weekly.pageCount, 10);
  assert.equal(weekly.overflow.length, 0);
  if (output)
    await writeFile(
      `${output}/november-2026-weekly-calendars.pdf`,
      weekly.bytes,
    );
  const large = await renderCalendarPdf(
    doc,
    "2026-11",
    [doc.calendars[0]],
    "large",
  );
  assert.equal(large.pageCount, 30);
  assert.equal(large.overflow.length, 0);
  if (output)
    await writeFile(
      `${output}/november-2026-willow-large-print.pdf`,
      large.bytes,
    );
  console.log(
    `Calendar checks passed. ${events.length} generated/shared activity records; weekly and large-print layouts fit.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
