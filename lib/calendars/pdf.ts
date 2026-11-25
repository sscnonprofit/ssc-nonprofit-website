import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  daysInMonth,
  forCalendar,
  monthLabel,
  notesFor,
  occurrences,
  timeLabel,
  type Calendar,
  type CalendarAppearance,
  type CalendarDocument,
  type CalendarEvent,
  type DayNote,
} from "./model";

import { calendarAppearance, calendarWeekdays, contrastText, printAccent } from "./appearance";

const hexColor = (hex: string) => rgb(...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]);
type Mode = "month" | "week" | "large";
type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };
type Line = { text: string; font: PDFFont; gap: number };
const ink = rgb(0.15, 0.15, 0.15),
  paper = rgb(1, 1, 1),
  rule = rgb(0.65, 0.65, 0.65);
const safeText = (s: string) =>
  s
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7e\u00a0-\u00ff]/g, "");
function wrap(text: string, font: PDFFont, size: number, width: number) {
  const result: string[] = [];
  let line = "";
  for (const word of safeText(text).split(/\s+/)) {
    if (!word) continue;
    if (
      font.widthOfTextAtSize(`${line}${line ? " " : ""}${word}`, size) <= width
    )
      line += `${line ? " " : ""}${word}`;
    else {
      if (line) result.push(line);
      line = "";
      for (const character of word) {
        if (font.widthOfTextAtSize(line + character, size) > width) {
          result.push(line);
          line = character;
        } else line += character;
      }
    }
  }
  if (line) result.push(line);
  return result;
}
function eventLines(
  events: CalendarEvent[],
  doc: CalendarDocument,
  fonts: Fonts,
  size: number,
  width: number,
  appearance: CalendarAppearance,
): Line[] {
  const lines: Line[] = [];
  for (const e of events) {
    const location = doc.locations.find((l) => l.id === e.locationId)?.code;
    const label = [
      e.allDay ? "" : timeLabel(e.time).replace(" AM", "a").replace(" PM", "p"),
      e.cancelled ? `CANCELLED: ${e.title}` : e.title,
      e.host ? `w/${e.host}` : "",
      appearance.showLocation && location ? `- ${location}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const font = e.featured || e.banner ? fonts.bold : fonts.regular;
    const first = wrap(label, font, size, width);
    first.forEach((text, i) =>
      lines.push({ text, font, gap: i === 0 && lines.length ? size * { compact: 0, comfortable: 0.1, spacious: 0.5 }[appearance.density] : 0 }),
    );
    const extra = [
      e.endTime && !e.allDay ? `Until ${timeLabel(e.endTime)}` : "",
      e.notes,
      e.detail && !e.title.toLowerCase().includes(e.detail.toLowerCase())
        ? e.detail
        : "",
      e.signUp && !e.notes.toLowerCase().includes("sign up")
        ? `Sign up${e.contact ? ` with ${e.contact}` : " required"}`
        : "",
    ]
      .filter(Boolean)
      .join("; ");
    wrap(appearance.showEventDetails ? extra : "", fonts.italic, size, width).forEach((text) =>
      lines.push({ text, font: fonts.italic, gap: 0 }),
    );
  }
  return lines;
}
function cell(
  page: PDFPage,
  x: number,
  top: number,
  width: number,
  height: number,
  date: string,
  events: CalendarEvent[],
  notes: DayNote[],
  doc: CalendarDocument,
  fonts: Fonts,
  preferred: number,
  minimum: number,
  appearance: CalendarAppearance,
) {
  const weekend = [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());
  const lineHeight = { compact: 1.05, comfortable: 1.1, spacious: 1.25 }[appearance.density];
  page.drawRectangle({
    x,
    y: top - height,
    width,
    height,
    borderColor: rule,
    borderWidth: appearance.gridLines ? 0.55 : 0,
    ...(appearance.shadeWeekends && weekend ? { color: rgb(0.95, 0.95, 0.95) } : {}),
  });
  page.drawText(String(Number(date.slice(8))), {
    x: appearance.headerAlign === "center" ? x + (width - fonts.bold.widthOfTextAtSize(String(Number(date.slice(8))), 10)) / 2 : x + 5,
    y: top - 13,
    font: fonts.bold,
    size: 10,
    color: ink,
  });
  if (events.length === 1 && events[0].banner) {
    const size = Math.max(12, preferred),
      lines = eventLines(events, doc, fonts, size, width - 10, appearance);
    const noteLines = notes.flatMap((n) =>
      wrap(n.text, fonts.italic, minimum, width - 10),
    );
    const contentHeight = lines.length * size * 1.15;
    // Center the banner between the date number and the notes at the bottom.
    const notesTop =
      top - height + 5 + noteLines.length * minimum * 1.1 + (noteLines.length ? 3 : 0);
    let y = (top - 16 + notesTop) / 2 + contentHeight / 2;
    for (const line of lines) {
      y -= size * 1.15;
      page.drawText(line.text, {
        x: x + (width - line.font.widthOfTextAtSize(line.text, size)) / 2,
        y,
        size,
        font: line.font,
        color: ink,
      });
    }
    noteLines.forEach((line, i) =>
      page.drawText(line, {
        x: x + 5,
        y: top - height + 5 + (noteLines.length - 1 - i) * minimum * 1.1,
        size: minimum,
        font: fonts.italic,
        color: ink,
      }),
    );
    return {
      overflow: contentHeight + noteLines.length * minimum * 1.1 > height - 25,
      size,
    };
  }
  let size = preferred,
    lines: Line[] = [],
    noteLines: string[] = [],
    needed = 0;
  while (size >= minimum) {
    lines = eventLines(events, doc, fonts, size, width - 10, appearance);
    noteLines = notes.flatMap((n) =>
      wrap(n.text, n.banner ? fonts.bold : fonts.italic, size, width - 10),
    );
    needed =
      lines.reduce((n, l) => n + size * lineHeight + l.gap, 0) +
      noteLines.length * size * lineHeight +
      (noteLines.length ? 5 : 0);
    if (needed <= height - 20) break;
    size -= 0.25;
  }
  const overflow = needed > height - 20;
  size = Math.max(size, minimum);
  let y = top - 15;
  for (const line of lines) {
    y -= line.gap + size * lineHeight;
    if (y < top - height + 4) break;
    page.drawText(line.text, {
      x: x + 5,
      y,
      font: line.font,
      size,
      color: ink,
    });
  }
  let noteY = top - height + 5 + (noteLines.length - 1) * size * lineHeight;
  for (const line of noteLines) {
    page.drawText(line, {
      x: x + 5,
      y: noteY,
      font: fonts.italic,
      size,
      color: ink,
    });
    noteY -= size * lineHeight;
  }
  return { overflow, size };
}
async function imageBytes(url: string) {
  if (
    url.startsWith("/images/") &&
    !url.includes("..") &&
    /^\/images\/[a-zA-Z0-9/_.-]+\.(png|jpe?g)$/i.test(url)
  ) {
    const bytes = await readFile(path.join(process.cwd(), "public", url));
    if (bytes.length > 5_000_000) throw new Error("Header image exceeds 5 MB");
    return bytes;
  }
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname.endsWith(".public.blob.vercel-storage.com") ||
    parsed.username ||
    parsed.password ||
    parsed.port
  )
    throw new Error(
      "PDF header images must use a public Vercel Blob URL or a local /images/ file",
    );
  const response = await fetch(parsed, {
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  if (
    !response.ok ||
    Number(response.headers.get("content-length") || 0) > 5_000_000
  )
    throw new Error("Cannot load header image (maximum 5 MB)");
  const reader = response.body!.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.length;
    if (size > 5_000_000) {
      await reader.cancel();
      throw new Error("Header image exceeds 5 MB");
    }
    parts.push(result.value);
  }
  return Buffer.concat(parts);
}
export async function renderCalendarPdf(
  doc: CalendarDocument,
  month: string,
  calendars: Calendar[],
  mode: Mode = "month",
) {
  const pdf = await PDFDocument.create();
  const overflow: string[] = [],
    warnings: string[] = [];
  pdf.setTitle(`${monthLabel(month)} - SSC Activity Calendars`);
  pdf.setAuthor("Sheboygan Senior Community");
  const serif = {
    regular: await pdf.embedFont(StandardFonts.TimesRoman),
    bold: await pdf.embedFont(StandardFonts.TimesRomanBold),
    italic: await pdf.embedFont(StandardFonts.TimesRomanItalic),
  };
  const sans = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };
  const all = occurrences(doc, month);
  const days = daysInMonth(month);
  for (const calendar of calendars) {
    const appearance = calendarAppearance(calendar);
    const fonts = calendar.font === "serif" ? serif : sans;
    const events = all
      .filter((e) => e.calendarIds.includes(calendar.id) && e.title)
      .map((e) => forCalendar(e, calendar.id))
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          (a.allDay ? "" : a.time).localeCompare(b.allDay ? "" : b.time),
      );
    const notes = notesFor(doc, calendar, month);
    let image: Awaited<ReturnType<PDFDocument["embedPng"]>> | undefined;
    const imageUrl = doc.months[`${calendar.id}:${month}`]?.headerImage;
    if (imageUrl) {
      try {
        const bytes = await imageBytes(imageUrl);
        image =
          bytes[0] === 137
            ? await pdf.embedPng(bytes)
            : await pdf.embedJpg(bytes);
      } catch (error) {
        overflow.push(`${calendar.name}: ${(error as Error).message}`);
      }
    }
    const brand = hexColor(printAccent(calendar));
    const brandForeground = hexColor(contrastText(printAccent(calendar)));
    function page(label: string) {
      const p = pdf.addPage([792, 612]);
      p.drawRectangle({ x: 0, y: 0, width: 792, height: 612, color: paper });
      p.drawText(safeText(label), {
        x: appearance.headerAlign === "center" ? 24 + ((image ? 630 : 744) - fonts.bold.widthOfTextAtSize(safeText(label), 21)) / 2 : 24,
        y: 584,
        font: fonts.bold,
        size: 21,
        color: contrastText(printAccent(calendar)) === "#ffffff" ? brand : ink,
      });
      const nameSize = Math.min(
        11,
        (11 * (image ? 630 : 744)) /
          Math.max(
            1,
            fonts.bold.widthOfTextAtSize(safeText(calendar.name), 11),
          ),
      );
      const subtitleSize = Math.min(
        10,
        (10 * (image ? 630 : 744)) /
          Math.max(
            1,
            fonts.regular.widthOfTextAtSize(safeText(calendar.subtitle), 10),
          ),
      );
      p.drawText(safeText(calendar.name), {
        x: appearance.headerAlign === "center" ? 24 + ((image ? 630 : 744) - fonts.bold.widthOfTextAtSize(safeText(calendar.name), nameSize)) / 2 : 24,
        y: 567,
        font: fonts.bold,
        size: nameSize,
        color: ink,
      });
      p.drawText(safeText(calendar.subtitle), {
        x: appearance.headerAlign === "center" ? 24 + ((image ? 630 : 744) - fonts.regular.widthOfTextAtSize(safeText(calendar.subtitle), subtitleSize)) / 2 : 24,
        y: 553,
        font: fonts.regular,
        size: subtitleSize,
        color: ink,
      });
      if (image) {
        const scale = Math.min(100 / image.width, 52 / image.height);
        p.drawImage(image, {
          x: 768 - image.width * scale,
          y: 552,
          width: image.width * scale,
          height: image.height * scale,
        });
      }
      const footer = wrap(calendar.footer, fonts.regular, 8, 744);
      footer.slice(0, 2).forEach((t, i) =>
        p.drawText(t, {
          x: 24,
          y: 22 - i * 10,
          font: fonts.regular,
          size: 8,
          color: ink,
        }),
      );
      return p;
    }
    function drawGrid(
      dates: (string | undefined)[],
      rows: number,
      label: string,
    ) {
      const p = page(label);
      const top = 542,
        head = 20,
        width = 744 / 7,
        height = (top - head - 38) / rows;
      const weekdays = calendarWeekdays(appearance.weekStartsOn);
      weekdays.forEach((day, i) => {
        p.drawRectangle({
          x: 24 + i * width,
          y: top - head,
          width,
          height: head,
          color: calendar.theme === "classic" ? brand : paper,
          borderColor: rule,
          borderWidth: appearance.gridLines ? 0.55 : 0,
        });
        p.drawText(day, {
          x:
            24 + i * width + (width - fonts.bold.widthOfTextAtSize(day, 9)) / 2,
          y: top - 13,
          font: fonts.bold,
          size: 9,
          color: calendar.theme === "classic" ? brandForeground : ink,
        });
      });
      dates.forEach((date, i) => {
        const x = 24 + (i % 7) * width,
          y = top - head - Math.floor(i / 7) * height;
        if (!date) {
          p.drawRectangle({
            x,
            y: y - height,
            width,
            height,
            borderColor: rule,
            borderWidth: appearance.gridLines ? 0.55 : 0,
          });
          return;
        }
        const fit = cell(
          p,
          x,
          y,
          width,
          height,
          date,
          events.filter((e) => e.date === date),
          notes.filter((n) => n.date === date),
          doc,
          fonts,
          (mode === "week" ? 11 : 9) * appearance.fontSize / 16,
          mode === "week" ? 9 : 6,
          appearance,
        );
        if (fit.overflow)
          overflow.push(
            `${calendar.name}, ${date}: content exceeds the cell. Choose weekly or large print.`,
          );
        else if (fit.size < 8)
          warnings.push(
            `${calendar.name}, ${date}: auto-fit uses ${fit.size} pt text. Consider weekly or large print.`,
          );
      });
    }
    const offset = (new Date(`${month}-01T12:00:00Z`).getUTCDay() - appearance.weekStartsOn + 7) % 7;
    const slots: (string | undefined)[] = [
      ...Array(offset).fill(undefined),
      ...days,
    ];
    while (slots.length % 7) slots.push(undefined);
    if (mode === "month") drawGrid(slots, slots.length / 7, monthLabel(month));
    else if (mode === "week")
      for (let i = 0; i < slots.length; i += 7)
        drawGrid(
          slots.slice(i, i + 7),
          1,
          `${monthLabel(month)} - Week ${i / 7 + 1}`,
        );
    else
      for (const date of days) {
        const p = page(
          new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          }),
        );
        const fit = cell(
          p,
          24,
          538,
          744,
          500,
          date,
          events.filter((e) => e.date === date),
          notes.filter((n) => n.date === date),
          doc,
          fonts,
          appearance.fontSize,
          14,
          appearance,
        );
        if (fit.overflow)
          overflow.push(
            `${calendar.name}, ${date}: too much content even for large print; shorten the notes.`,
          );
      }
  }
  return {
    bytes: await pdf.save(),
    overflow,
    warnings,
    pageCount: pdf.getPageCount(),
  };
}
