import { NextResponse } from "next/server"

import { getSearchConsoleOverview } from "@/lib/admin/search-console"

export async function GET() {
  try {
    return NextResponse.json(await getSearchConsoleOverview())
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load Search Console data"
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 })
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
