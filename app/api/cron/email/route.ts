import { NextResponse } from "next/server"

import { runDigestJob } from "@/lib/email/digest"
import { runReminderJob } from "@/lib/email/events"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorized = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : process.env.NODE_ENV !== "production"
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [digests, reminders] = await Promise.all([runDigestJob(), runReminderJob()])
  return NextResponse.json({ digests, reminders })
}
