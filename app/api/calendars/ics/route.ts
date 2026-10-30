import { readStore, publicDocument } from "@/lib/calendars/service";
import { createIcs } from "@/lib/calendars/ics";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("calendar") || "";
  const row = await readStore();
  const doc = publicDocument(row.document);
  const calendar = doc.calendars.find((c) => c.id === id);
  if (!calendar) return new Response("Calendar not found", { status: 404 });
  return new Response(createIcs(doc, calendar, row.version, row.updatedAt), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=ssc-calendar.ics",
      "Cache-Control": "public, max-age=300",
    },
  });
}
