import type { Metadata } from "next"
import fallback from "@/content/pillars.json"
import { PartnersEditor } from "@/components/admin/partners/partners-editor"
import { requirePermission } from "@/lib/cms/auth-helpers"
import { getPageRow } from "@/lib/cms/pages"
import { getPartnerSection } from "@/lib/cms/partners"
import { hasPermission } from "@/lib/cms/roles"

export const metadata: Metadata = { title: "Partners | SSC Content Manager", robots: { index: false, follow: false } }

export default async function PartnersPage() {
  const user = await requirePermission("view_content")
  const row = await getPageRow("pillars")
  return <PartnersEditor
    initialSection={getPartnerSection(row?.draftContent ?? row?.content ?? fallback)}
    initialLive={getPartnerSection(row?.content ?? fallback)}
    initialVersion={row?.updatedAt.toISOString() ?? null}
    canEdit={hasPermission(user.role, "edit_content")}
    canPublish={hasPermission(user.role, "publish_content")}
  />
}
