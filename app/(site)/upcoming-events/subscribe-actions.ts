"use server"

import { randomBytes } from "node:crypto"
import { and, eq } from "drizzle-orm"

import { CATEGORIES } from "@/lib/calendars/model"
import { publicDocument } from "@/lib/calendars/access"
import { readStore } from "@/lib/calendars/service"
import { db } from "@/lib/db"
import { calendarSubscriptions } from "@/lib/db/schema"
import { siteUrl } from "@/lib/email/config"
import { sendEmail } from "@/lib/email/send"
import { subscriptionConfirmEmail } from "@/lib/email/templates"

export type SubscribeResult = { ok: true; message: string } | { ok: false; error: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseCategories(value: unknown) {
  const allowed = new Set<string>(CATEGORIES)
  return Array.isArray(value) ? Array.from(new Set(value.filter((item): item is string => typeof item === "string" && allowed.has(item)))) : []
}

export async function subscribeToCalendarAction(input: {
  email: string
  name?: string
  calendarId: string
  categories?: string[]
  company?: string
}): Promise<SubscribeResult> {
  // Honeypot — pretend success for bots.
  if (input.company) return { ok: true, message: "Check your email to confirm your subscription." }

  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 200)
  const name = String(input.name ?? "").trim().slice(0, 120)
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: "Please enter a valid email address." }

  const store = await readStore()
  const calendar = publicDocument(store.document).calendars.find((item) => item.id === input.calendarId)
  if (!calendar) return { ok: false, error: "Please choose a calendar." }

  const frequency = "monthly"
  const categories = parseCategories(input.categories)

  const [existing] = await db
    .select()
    .from(calendarSubscriptions)
    .where(and(eq(calendarSubscriptions.email, email), eq(calendarSubscriptions.calendarId, calendar.id)))
    .limit(1)

  let token = existing?.token
  if (existing) {
    await db
      .update(calendarSubscriptions)
      .set({ frequency, categories, name: name || existing.name, unsubscribedAt: null, confirmedAt: existing.unsubscribedAt ? null : existing.confirmedAt })
      .where(eq(calendarSubscriptions.id, existing.id))
    if (existing.confirmedAt && !existing.unsubscribedAt) {
      return { ok: true, message: "You're already subscribed. We've updated your preferences." }
    }
  } else {
    token = randomBytes(24).toString("hex")
    await db.insert(calendarSubscriptions).values({ email, name, calendarId: calendar.id, frequency, categories, token })
  }

  const mail = subscriptionConfirmEmail({
    calendarName: calendar.name,
    url: `${siteUrl()}/api/email/confirm?token=${token}`,
  })
  const result = await sendEmail({ kind: "subscription-confirm", to: email, ...mail })
  if (!result.ok) {
    return { ok: false, error: "We couldn't send the confirmation email just now. Please try again shortly or call us at (920) 458-2137." }
  }
  return { ok: true, message: "Almost done. Check your email and click the confirmation link." }
}

export async function updateSubscriptionAction(input: {
  token: string
  categories: string[]
}): Promise<SubscribeResult> {
  const token = String(input.token ?? "")
  if (!token) return { ok: false, error: "This link is not valid." }
  const updated = await db
    .update(calendarSubscriptions)
    .set({ frequency: "monthly", categories: parseCategories(input.categories) })
    .where(eq(calendarSubscriptions.token, token))
    .returning({ id: calendarSubscriptions.id })
  if (!updated.length) return { ok: false, error: "This link is not valid." }
  return { ok: true, message: "Your preferences were saved." }
}

export async function unsubscribeAction(token: string): Promise<SubscribeResult> {
  const updated = await db
    .update(calendarSubscriptions)
    .set({ unsubscribedAt: new Date() })
    .where(eq(calendarSubscriptions.token, String(token ?? "")))
    .returning({ id: calendarSubscriptions.id })
  if (!updated.length) return { ok: false, error: "This link is not valid." }
  return { ok: true, message: "You've been unsubscribed. You won't receive any more emails from this calendar." }
}
