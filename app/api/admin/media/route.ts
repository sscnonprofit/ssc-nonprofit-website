import { del, list } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

import { requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"

const PREFIX = "content/"

export async function GET(request: NextRequest) {
  try {
    await requireEditor()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined
  try {
    const result = await list({ prefix: PREFIX, limit: 100, cursor })
    return NextResponse.json({
      items: result.blobs
        .map((b) => ({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt }))
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
      cursor: result.hasMore ? result.cursor : null,
    })
  } catch (error) {
    console.error("[v0] Media list failed:", error)
    return NextResponse.json({ error: "Could not load media" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Only admins can delete media" }, { status: 403 })
  }
  const { url } = (await request.json().catch(() => ({}))) as { url?: string }
  if (!url || typeof url !== "string") return NextResponse.json({ error: "Missing url" }, { status: 400 })
  let pathname: string
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) throw new Error("bad host")
    pathname = decodeURIComponent(parsed.pathname.slice(1))
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }
  if (!pathname.startsWith(PREFIX)) return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  await del(url)
  return NextResponse.json({ ok: true })
}
