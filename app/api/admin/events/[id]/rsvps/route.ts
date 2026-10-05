import { NextResponse } from "next/server"

import { requirePermission } from "@/lib/cms/auth-helpers"
import { getEventById, listRsvps } from "@/lib/events/data"
import { formatEventDate } from "@/lib/events/occurrences"

function cell(value: string | number) {
  let text = String(value)
  // Stop spreadsheet apps from running a guest-supplied value as a formula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("view_content")
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const eventId = Number(id)
  const event = Number.isInteger(eventId) ? await getEventById(eventId) : null
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rows = await listRsvps(event.id)
  const header = ["Name", "Email", "Phone", "Guests", "Date attending", "Note", "Signed up"]
  const lines = rows.map((row) =>
    [
      row.name,
      row.email,
      row.phone,
      row.guests,
      formatEventDate(new Date(row.occurrence), { dateStyle: "medium", timeStyle: "short" }),
      row.note,
      formatEventDate(row.createdAt, { dateStyle: "medium", timeStyle: "short" }),
    ]
      .map(cell)
      .join(","),
  )

  return new NextResponse([header.map(cell).join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-rsvps.csv"`,
    },
  })
}
