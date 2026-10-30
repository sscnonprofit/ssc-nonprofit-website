import { ADMIN_THEME_INIT_SCRIPT, AdminThemeProvider } from "@/components/admin/admin-theme-provider"
import { Toaster } from "@/components/ui/sonner"

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ADMIN_THEME_INIT_SCRIPT }} />
      <AdminThemeProvider>
        {children}
        <Toaster />
      </AdminThemeProvider>
    </>
  )
}
