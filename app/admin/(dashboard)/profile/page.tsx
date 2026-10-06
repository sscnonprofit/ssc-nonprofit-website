import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"

import { ProfileSettings } from "@/components/admin/profile-settings"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/admin/sign-in")

  const [profile] = await db.select({ prefix: userTable.prefix }).from(userTable).where(eq(userTable.id, session.user.id)).limit(1)

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">Account</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">Profile settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Manage the name, prefix, and avatar your team sees.</p>
      </div>
      <ProfileSettings initialPrefix={profile?.prefix ?? ""} />
    </div>
  )
}
