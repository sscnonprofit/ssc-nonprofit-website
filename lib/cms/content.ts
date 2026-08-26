import { getPublishedContent } from "@/lib/cms/pages"

/**
 * Resolves the live content for a CMS document: the published row in the
 * database if an editor has saved one, otherwise the bundled JSON that
 * shipped with the site. This lets every page keep working (and stay
 * type-shaped like the original JSON) before an editor ever touches it in
 * the admin, while edits made through /admin take over immediately once
 * published.
 */
export async function getContent<T>(slug: string, fallback: T): Promise<T> {
  try {
    const published = await getPublishedContent<T>(slug)
    return published ?? fallback
  } catch {
    // Database unreachable — never take down a public page over it.
    return fallback
  }
}
