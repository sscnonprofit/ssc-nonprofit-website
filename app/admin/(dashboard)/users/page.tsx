import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { UsersTable } from "@/components/admin/users-table"
import { auth } from "@/lib/auth"
import { listUsersAction } from "@/app/admin/actions"

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== "admin") redirect("/admin")

  const users = await listUsersAction()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Admins can publish content and manage roles. Editors can draft and save changes for review.
        </p>
      </div>
      <UsersTable users={users} currentUserId={session!.user.id} />
    </div>
  )
}
