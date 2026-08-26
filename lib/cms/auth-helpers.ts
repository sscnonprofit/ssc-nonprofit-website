import { headers } from "next/headers"

import { auth } from "@/lib/auth"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  return session.user as unknown as SessionUser
}

/** Any signed-in user can draft and edit content. */
export async function requireEditor(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

/** Only admins can publish content and manage other users. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireEditor()
  if (user.role !== "admin") throw new Error("Forbidden: admin role required")
  return user
}
