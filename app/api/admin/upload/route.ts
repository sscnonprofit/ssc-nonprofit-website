import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

import { requireEditor } from "@/lib/cms/auth-helpers"

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"])

export async function POST(request: NextRequest) {
  try {
    await requireEditor()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 8MB)" }, { status: 400 })
  }

  try {
    const extension = file.type.split("/")[1] ?? "jpg"
    const filename = `content/${crypto.randomUUID()}.${extension}`

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Image upload failed:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
