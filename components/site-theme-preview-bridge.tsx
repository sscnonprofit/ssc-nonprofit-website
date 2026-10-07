"use client"

import { useEffect, useState, type ReactNode } from "react"

import type siteFallback from "@/content/site.json"
import { SiteAnnouncement } from "@/components/site-announcement"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { sanitizeTheme, themeToVars, type ThemeSettings } from "@/lib/cms/theme"

const MESSAGE_TYPE = "ssc-design-studio-theme"

export function SiteThemePreviewBridge({ site, theme, children }: { site: typeof siteFallback; theme: ThemeSettings; children: ReactNode }) {
  const [previewTheme, setPreviewTheme] = useState<ThemeSettings | null>(null)

  useEffect(() => {
    if (window.parent === window || !new URLSearchParams(window.location.search).has("designStudioPreview")) return

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== MESSAGE_TYPE || !event.data.theme) return
      const next = sanitizeTheme(event.data.theme)
      for (const [key, value] of Object.entries(themeToVars(next, { allColors: true }))) {
        document.documentElement.style.setProperty(key, value)
      }
      let style = document.getElementById("ssc-design-studio-preview-css") as HTMLStyleElement | null
      if (!style) {
        style = document.createElement("style")
        style.id = "ssc-design-studio-preview-css"
        document.head.appendChild(style)
      }
      style.textContent = next.customCss
      setPreviewTheme(next)
    }

    window.addEventListener("message", onMessage)
    // Announce readiness once; acknowledging each update creates a message loop.
    window.parent.postMessage({ type: `${MESSAGE_TYPE}:ready` }, window.location.origin)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  const activeTheme = previewTheme ?? theme
  return (
    <>
      <SiteAnnouncement announcement={activeTheme.announcement} />
      <SiteHeader site={site} header={activeTheme.header} />
      {children}
      <SiteFooter site={site} theme={activeTheme} />
    </>
  )
}

export const DESIGN_STUDIO_THEME_MESSAGE = MESSAGE_TYPE
