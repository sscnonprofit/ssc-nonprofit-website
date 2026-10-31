import { and, eq, isNull } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { calendarSubscriptions } from "@/lib/db/schema"
import { siteUrl } from "@/lib/email/config"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? ""
  const target = new URL("/email-preferences", siteUrl())
  target.searchParams.set("token", token)

  if (token) {
    const updated = await db
      .update(calendarSubscriptions)
      .set({ confirmedAt: new Date(), unsubscribedAt: null })
      .where(and(eq(calendarSubscriptions.token, token), isNull(calendarSubscriptions.confirmedAt)))
      .returning({ id: calendarSubscriptions.id })
    if (updated.length) target.searchParams.set("status", "confirmed")
  }
  return NextResponse.redirect(target)
}
