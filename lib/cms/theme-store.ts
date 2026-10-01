import { DEFAULT_THEME, sanitizeTheme, type ThemeSettings } from "@/lib/cms/theme"
import { getPageRow } from "@/lib/cms/pages"

export const THEME_SLUG = "theme"

/** Published theme, or the draft when `draft` is true (draft mode / admin editors). */
export async function getTheme({ draft = false }: { draft?: boolean } = {}): Promise<ThemeSettings> {
  try {
    const row = await getPageRow(THEME_SLUG)
    if (!row) return DEFAULT_THEME
    return sanitizeTheme(draft ? (row.draftContent ?? row.content) : row.content)
  } catch {
    return DEFAULT_THEME
  }
}

export async function getThemeState() {
  const row = await getPageRow(THEME_SLUG).catch(() => null)
  const published = row ? sanitizeTheme(row.content) : DEFAULT_THEME
  const draft = row?.draftContent ? sanitizeTheme(row.draftContent) : null
  return { published, draft, updatedAt: row?.updatedAt ?? null }
}
