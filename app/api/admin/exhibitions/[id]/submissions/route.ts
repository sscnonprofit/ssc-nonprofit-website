import { NextResponse } from "next/server"

import { requirePermission } from "@/lib/cms/auth-helpers"
import { formatEventDate } from "@/lib/events/occurrences"
import { getExhibitionById, listExhibitionSubmissions, submissionStatusLabel } from "@/lib/gallery/exhibitions"

function cell(value: string | number | null) {
  let text = String(value ?? "")
  // Stop spreadsheet apps from running an artist-supplied value as a formula.
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
  const exhibitionId = Number(id)
  const exhibition = Number.isInteger(exhibitionId) ? await getExhibitionById(exhibitionId) : null
  if (!exhibition) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rows = await listExhibitionSubmissions(exhibition.id)
  const header = ["Artist", "Email", "Phone", "Artwork", "Medium", "Dimensions", "Year", "Price", "Not for sale", "Portfolio", "Images", "Status", "Review notes", "Submitted"]
  const lines = rows.map((row) =>
    [
      row.artistName,
      row.artistEmail,
      row.artistPhone,
      row.artworkTitle,
      row.medium,
      row.dimensions,
      row.yearCreated,
      row.askingPrice,
      row.notForSale ? "Yes" : "",
      row.portfolioUrl,
      Array.isArray(row.imageUrls) ? (row.imageUrls as string[]).join(" ") : "",
      submissionStatusLabel(row.status),
      row.reviewNotes,
      formatEventDate(row.createdAt, { dateStyle: "medium", timeStyle: "short" }),
    ]
      .map(cell)
      .join(","),
  )

  return new NextResponse([header.map(cell).join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exhibition.slug}-submissions.csv"`,
    },
  })
}
