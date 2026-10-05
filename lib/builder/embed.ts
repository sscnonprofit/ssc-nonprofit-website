export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "")
    let id: string | null = null
    if (host === "youtu.be") id = u.pathname.slice(1)
    else if (host.endsWith("youtube.com")) id = u.searchParams.get("v") ?? u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1] ?? null
    if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`
    if (host.endsWith("vimeo.com")) {
      const vid = u.pathname.match(/(\d{5,12})/)?.[1]
      if (vid) return `https://player.vimeo.com/video/${vid}`
    }
  } catch {
    return null
  }
  return null
}
