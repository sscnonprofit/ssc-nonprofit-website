import type { Metadata } from "next"
import { CafeMenuEditor } from "@/components/admin/cafe-menu/cafe-menu-editor"
import { requirePermission } from "@/lib/cms/auth-helpers"
import { getPageRow } from "@/lib/cms/pages"
import { hasPermission } from "@/lib/cms/roles"
import { CAFE_MENU_SLUG, getCafeMenu } from "@/lib/cafe/menu"

export const metadata: Metadata = { title: "Café Menu | SSC Content Manager", robots: { index: false, follow: false } }

export default async function CafeMenuAdminPage() {
  const user = await requirePermission("view_content")
  const row = await getPageRow(CAFE_MENU_SLUG)
  return <CafeMenuEditor
    initialMenu={getCafeMenu(row?.draftContent ?? row?.content)}
    initialLive={getCafeMenu(row?.content)}
    initialVersion={row?.updatedAt.toISOString() ?? null}
    canEdit={hasPermission(user.role, "edit_content")}
    canPublish={hasPermission(user.role, "publish_content")}
  />
}
