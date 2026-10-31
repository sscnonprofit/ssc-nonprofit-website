import type { Calendar, CalendarDocument } from "./model";
const escape = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
function fold(line: string) {
  const lines: string[] = [];
  let current = "";
  for (const c of line) {
    if (Buffer.byteLength(current + c) > 75) {
      lines.push(current);
      current = ` ${c}`;
    } else current += c;
  }
  lines.push(current);
  return lines.join("\r\n");
}
export function createIcs(
  doc: CalendarDocument,
  calendar: Calendar,
  version: number,
  updatedAt: Date,
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SSC//Activity Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escape(calendar.name)}`,
    "X-WR-TIMEZONE:America/Chicago",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "BEGIN:VTIMEZONE",
    "TZID:America/Chicago",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0600",
    "TZOFFSETTO:-0500",
    "TZNAME:CDT",
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0600",
    "TZNAME:CST",
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
  const stamp = updatedAt
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  for (const e of doc.events.filter(
    (e) => e.calendarIds.includes(calendar.id) && e.title,
  )) {
    const date = e.date.replace(/-/g, "");
    const location = doc.locations.find((l) => l.id === e.locationId);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escape(`${e.id.includes(":") ? e.id.slice(e.id.indexOf(":") + 1) : e.id}-${calendar.id}`)}@sscnonprofit.org`,
      `DTSTAMP:${stamp}`,
      `LAST-MODIFIED:${stamp}`,
      `SEQUENCE:${version}`,
      `SUMMARY:${escape(e.title)}`,
    );
    if (e.allDay) {
      const next = new Date(`${e.date}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      lines.push(
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`,
      );
    } else {
      lines.push(
        `DTSTART;TZID=America/Chicago:${date}T${e.time.replace(":", "")}00`,
      );
      if (e.endTime)
        lines.push(
          `DTEND;TZID=America/Chicago:${date}T${e.endTime.replace(":", "")}00`,
        );
    }
    if (location) lines.push(`LOCATION:${escape(location.name)}`);
    lines.push(
      `DESCRIPTION:${escape([e.notes, e.detail, e.host ? `Led by ${e.host}` : "", e.signUp ? `Sign up with ${e.contact || "staff"}` : ""].filter(Boolean).join("\n"))}`,
      `CATEGORIES:${e.category}`,
      `STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
