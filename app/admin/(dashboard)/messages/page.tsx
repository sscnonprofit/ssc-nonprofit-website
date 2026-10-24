import type { Metadata } from "next"
import { desc } from "drizzle-orm"

import { MessagesManager } from "@/components/admin/messages/messages-manager"
import { getSessionUser } from "@/lib/cms/auth-helpers"
import { db } from "@/lib/db"
import { contactMessages } from "@/lib/db/schema"

export const metadata: Metadata = { title: "Messages" }
export const dynamic = "force-dynamic"

export default async function MessagesAdminPage() {
  const [user, rows] = await Promise.all([
    getSessionUser(),
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(500),
  ])

  const messages = rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    name: row.name,
    email: row.email,
    phone: row.phone,
    topic: row.topic,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Contact form enquiries and newsletter signups from the public site.</p>
      </div>
      <MessagesManager messages={messages} canDelete={user?.role === "admin"} />
    </div>
  )
}
