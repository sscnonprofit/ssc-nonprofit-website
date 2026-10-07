import { cache } from "react"
import { draftMode } from "next/headers"
import company from "@/content/company.json"
import { getContent } from "@/lib/cms/content"
import { getPageRow } from "@/lib/cms/pages"
import { createLeadershipContent, validateLeadershipContent } from "@/lib/cms/leadership"

export async function getLeadershipDefaults() {
  return createLeadershipContent(await getContent("company", company))
}

export const getLeadershipContent = cache(async () => {
  const fallback = await getLeadershipDefaults()
  const { isEnabled } = await draftMode()
  try {
    const row = await getPageRow("leadership")
    const content = isEnabled ? row?.draftContent ?? row?.content : row?.status === "published" ? row.content : null
    if (!content) return fallback
    validateLeadershipContent(content)
    return content
  } catch {
    return fallback
  }
})
