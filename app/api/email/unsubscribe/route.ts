import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { calendarSubscriptions } from "@/lib/db/schema"
import { siteUrl } from "@/lib/email/config"

export const dynamic = "force-dynamic"

async function unsubscribe(token: string) {
  if (!token) return false
  const updated = await db
    .update(calendarSubscriptions)
    .set({ unsubscribedAt: new Date() })
    .where(eq(calendarSubscriptions.token, token))
    .returning({ id: calendarSubscriptions.id })
  return updated.length > 0
}

/** Link clicks from the email footer. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? ""
  const done = await unsubscribe(token)
  const target = new URL("/email-preferences", siteUrl())
  target.searchParams.set("token", token)
  if (done) target.searchParams.set("status", "unsubscribed")
  return NextResponse.redirect(target)
}

/** RFC 8058 one-click unsubscribe used by Gmail and Apple Mail. */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? ""
  const done = await unsubscribe(token)
  return NextResponse.json({ ok: done }, { status: done ? 200 : 404 })
}
