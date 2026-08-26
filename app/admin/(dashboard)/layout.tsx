import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin/admin-shell"
import { auth } from "@/lib/auth"

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/admin/sign-in")

  const role = (session.user as { role?: string }).role ?? "editor"

  return (
    <AdminShell userName={session.user.name} userEmail={session.user.email} role={role}>
      {children}
    </AdminShell>
  )
}
