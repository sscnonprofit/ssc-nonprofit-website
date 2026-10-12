import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin/admin-shell"
import { ADMIN_THEME_INIT_SCRIPT, AdminThemeProvider } from "@/components/admin/admin-theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { auth } from "@/lib/auth"
import { countNewApplications } from "@/lib/employment/jobs"

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/admin/sign-in")
  if ((session.user as { disabled?: boolean }).disabled) redirect("/admin/sign-in?suspended=1")

  const role = (session.user as { role?: string }).role ?? "editor"
  const newApplications = await countNewApplications().catch(() => 0)

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ADMIN_THEME_INIT_SCRIPT }} />
      <AdminThemeProvider>
        <AdminShell userName={session.user.name} userEmail={session.user.email} role={role} newApplications={newApplications}>
          {children}
          <Toaster />
        </AdminShell>
      </AdminThemeProvider>
    </>
  )
}
