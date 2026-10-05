import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { hasPermission, type Permission } from "@/lib/cms/roles"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  disabled?: boolean
}

/** Returns the signed-in user, or null for signed-out and suspended accounts. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const user = session.user as unknown as SessionUser
  if (user.disabled) return null
  return user
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasPermission(user.role, permission)) {
    throw new Error("You do not have permission to do this.")
  }
  return user
}

/** Admins and editors can draft and edit content. Viewers are read-only. */
export async function requireEditor(): Promise<SessionUser> {
  return requirePermission("edit_content")
}

/** Only admins can publish content and manage other users. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  if (user.role !== "admin") throw new Error("Forbidden: admin role required")
  return user
}
