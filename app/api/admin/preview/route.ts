import { draftMode } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

import { getSessionUser } from "@/lib/cms/auth-helpers"

function safePath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/admin")) return "/"
  return value
}

/** Enables draft mode so the public site renders draft content and the draft theme. */
export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const path = safePath(request.nextUrl.searchParams.get("path"))
  const draft = await draftMode()

  if (request.nextUrl.searchParams.get("exit") === "1") {
    draft.disable()
  } else {
    draft.enable()
  }

  // Relative Location: behind proxies nextUrl.origin can report the wrong scheme/host.
  return new NextResponse(null, { status: 307, headers: { Location: path } })
}
