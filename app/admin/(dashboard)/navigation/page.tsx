import siteFallback from "@/content/site.json"
import { getPageRow } from "@/lib/cms/pages"
import { requireEditor } from "@/lib/cms/auth-helpers"
import { NavigationEditor } from "@/components/admin/navigation-editor"

export default async function NavigationPage() {
  const user = await requireEditor()
  const row = await getPageRow("site")
  const content = (row?.draftContent ?? row?.content ?? siteFallback) as typeof siteFallback
  return <NavigationEditor initialNav={content.nav} initialFooter={content.footer} isAdmin={user.role === "admin"} />
}
