import type { Metadata } from "next"

import { EventsManager } from "@/components/admin/events/events-manager"
import { getSessionUser } from "@/lib/cms/auth-helpers"
import { listAdminEventDetails, listAdminEvents } from "@/lib/events/data"

export const metadata: Metadata = { title: "Events" }
export const dynamic = "force-dynamic"

export default async function AdminEventsPage() {
  const [user, events, details] = await Promise.all([getSessionUser(), listAdminEvents(), listAdminEventDetails()])
  const role = user?.role ?? "viewer"
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create events, repeat them on a schedule, collect RSVPs and publish them to the public calendar.
        </p>
      </div>
      <EventsManager events={events} details={details} role={role} />
    </div>
  )
}
