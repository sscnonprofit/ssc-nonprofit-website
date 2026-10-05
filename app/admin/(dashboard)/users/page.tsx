import { redirect } from "next/navigation"

import { listUsersAction } from "@/app/admin/user-actions"
import { UsersManager } from "@/components/admin/users-manager"
import { getSessionUser } from "@/lib/cms/auth-helpers"

export default async function AdminUsersPage() {
  const current = await getSessionUser()
  if (!current || current.role !== "admin") redirect("/admin")

  const users = await listUsersAction()

  return <UsersManager users={users} currentUserId={current.id} />
}
