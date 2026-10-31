import { count, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin/admin-shell"
import { AdminThemeProvider } from "@/components/admin/admin-theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { contactMessages } from "@/lib/db/schema"
import { countNewApplications } from "@/lib/employment/jobs"

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/admin/sign-in")
  if ((session.user as { disabled?: boolean }).disabled) redirect("/admin/sign-in?suspended=1")

  const role = (session.user as { role?: string }).role ?? "editor"
  const [newApplications, newMessages] = await Promise.all([
    countNewApplications().catch(() => 0),
    db
      .select({ value: count() })
      .from(contactMessages)
      .where(eq(contactMessages.status, "new"))
      .then((rows) => rows[0]?.value ?? 0)
      .catch(() => 0),
  ])

  return (
    <>
      <AdminThemeProvider>
        <AdminShell userName={session.user.name} userEmail={session.user.email} role={role} newApplications={newApplications} newMessages={newMessages}>
          {children}
          <Toaster />
        </AdminShell>
      </AdminThemeProvider>
    </>
  )
}
