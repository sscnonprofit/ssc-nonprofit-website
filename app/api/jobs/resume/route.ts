import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

// Public endpoint: job applicants are not signed in. Only resumes are
// accepted, kept small, and stored under a dedicated prefix.
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])
const EXTENSION_BY_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 })
  }
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Upload a PDF or Word document" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 8MB)" }, { status: 400 })
  }

  try {
    const extension = EXTENSION_BY_TYPE[file.type] ?? "pdf"
    const filename = `resumes/${crypto.randomUUID()}.${extension}`

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url, filename: file.name })
  } catch (error) {
    console.error("[v0] Resume upload failed:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
