import { isMonth } from "@/lib/calendars/model";
import { renderCalendarPdf } from "@/lib/calendars/pdf";
import {
  publishedWorkspace,
  readStore,
  staffSession,
} from "@/lib/calendars/service";
import { CalendarInputError } from "@/lib/calendars/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const month = query.get("month") || "";
    const mode = query.get("mode") || "month";
    if (!isMonth(month) || !["month", "week", "large"].includes(mode))
      return Response.json(
        { error: "Invalid month or print format" },
        { status: 400 },
      );
    const isAdmin = query.has("admin");
    if (isAdmin) await staffSession();
    const doc = isAdmin
      ? (await readStore()).document
      : await publishedWorkspace();
    const id = query.get("calendar");
    const calendars = doc.calendars.filter(
      (c) => !c.archived && (id === "all" || c.id === id),
    );
    if (!calendars.length)
      return Response.json({ error: "Calendar not found" }, { status: 404 });
    const result = await renderCalendarPdf(
      doc,
      month,
      calendars,
      mode as "month" | "week" | "large",
    );
    if (query.has("check"))
      return Response.json(
        {
          overflow: result.overflow,
          warnings: result.warnings,
          pageCount: result.pageCount,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (result.overflow.length)
      return Response.json(
        {
          error: "Content does not fit. Choose weekly or large print.",
          overflow: result.overflow,
        },
        { status: 422 },
      );
    return new Response(Buffer.from(result.bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ssc-${month}-${id === "all" ? "calendars" : "calendar"}-${mode}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof CalendarInputError)
      return Response.json({ error: error.message }, { status: 401 });
    console.error("Calendar PDF failed", error);
    return Response.json(
      { error: "Unable to generate PDF. Please try again." },
      { status: 500 },
    );
  }
}
