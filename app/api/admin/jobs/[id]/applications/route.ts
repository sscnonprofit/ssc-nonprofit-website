import { NextResponse } from "next/server"

import { requirePermission } from "@/lib/cms/auth-helpers"
import { formatEventDate } from "@/lib/events/occurrences"
import { applicationStatusLabel, getJobById, listJobApplications } from "@/lib/employment/jobs"

function cell(value: string | number | null) {
  let text = String(value ?? "")
  // Stop spreadsheet apps from running an applicant-supplied value as a formula.
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
  const jobId = Number(id)
  const job = Number.isInteger(jobId) ? await getJobById(jobId) : null
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rows = await listJobApplications(job.id)
  const header = ["Name", "Email", "Phone", "Address", "Availability", "Desired pay", "Start date", "Experience", "Referral source", "Eligible to work", "Resume", "Status", "Review notes", "Applied"]
  const lines = rows.map((row) =>
    [
      row.fullName,
      row.email,
      row.phone,
      row.address,
      row.availability,
      row.desiredPay,
      row.startDate,
      row.yearsExperience,
      row.referralSource,
      row.eligibleToWork ? "Yes" : "",
      row.resumeUrl,
      applicationStatusLabel(row.status),
      row.reviewNotes,
      formatEventDate(row.createdAt, { dateStyle: "medium", timeStyle: "short" }),
    ]
      .map(cell)
      .join(","),
  )

  return new NextResponse([header.map(cell).join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${job.slug}-applications.csv"`,
    },
  })
}
