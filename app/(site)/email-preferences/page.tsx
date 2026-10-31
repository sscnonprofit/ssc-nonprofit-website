import type { Metadata } from "next"
import Link from "next/link"
import { eq } from "drizzle-orm"

import { SubscriptionPreferences } from "@/components/calendars/subscription-preferences"
import { publicDocument } from "@/lib/calendars/access"
import { readStore } from "@/lib/calendars/service"
import { db } from "@/lib/db"
import { calendarSubscriptions } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
}

export default async function EmailPreferencesPage({ searchParams }: { searchParams: Promise<{ token?: string; status?: string }> }) {
  const { token = "", status } = await searchParams
  const [subscription] = token
    ? await db.select().from(calendarSubscriptions).where(eq(calendarSubscriptions.token, token)).limit(1)
    : []

  const calendarName = subscription
    ? (publicDocument((await readStore()).document).calendars.find((item) => item.id === subscription.calendarId)?.name ?? "Activity calendar")
    : ""

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <h1 className="text-balance font-display text-3xl font-semibold sm:text-4xl">Email preferences</h1>
      {!subscription ? (
        <div className="mt-6 grid gap-4">
          <p className="leading-relaxed text-muted-foreground">This link is no longer valid. You can sign up again from our events page.</p>
          <Link href="/upcoming-events" className="w-fit font-semibold text-primary underline underline-offset-4">
            Go to upcoming events
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6">
          {status === "confirmed" && (
            <p className="rounded-xl border border-emerald-600/30 bg-emerald-50 p-4 text-emerald-900" role="status">
              You&apos;re confirmed. Your first email will arrive on the next scheduled send.
            </p>
          )}
          <p className="leading-relaxed text-muted-foreground">
            Subscription for <strong className="text-foreground">{subscription.email}</strong> — {calendarName}.
            {!subscription.confirmedAt && " Please click the confirmation link in your email to start receiving messages."}
          </p>
          <SubscriptionPreferences
            token={token}
            calendarName={calendarName}
            initialFrequency={subscription.frequency}
            initialCategories={Array.isArray(subscription.categories) ? (subscription.categories as string[]) : []}
            unsubscribed={Boolean(subscription.unsubscribedAt) || status === "unsubscribed"}
          />
        </div>
      )}
    </main>
  )
}
