import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DesignStudio } from "@/components/admin/design/design-studio"
import { getSessionUser } from "@/lib/cms/auth-helpers"
import { getThemeState } from "@/lib/cms/theme-store"

export const metadata: Metadata = { title: "Design Studio" }

export default async function DesignPage() {
  const user = await getSessionUser()
  if (!user) redirect("/admin/sign-in")

  const { published, draft } = await getThemeState()

  return (
    <DesignStudio
      initialTheme={draft ?? published}
      publishedTheme={published}
      hasDraft={draft !== null}
      isAdmin={user.role === "admin"}
    />
  )
}
