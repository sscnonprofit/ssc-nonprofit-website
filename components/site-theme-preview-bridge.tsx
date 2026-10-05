"use client"

import { useEffect } from "react"

const MESSAGE_TYPE = "ssc-design-studio-theme"

export function SiteThemePreviewBridge() {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== MESSAGE_TYPE) return
      const vars = event.data.vars as Record<string, string> | undefined
      if (!vars || typeof vars !== "object") return

      for (const [key, value] of Object.entries(vars)) {
        if (typeof value === "string") document.documentElement.style.setProperty(key, value)
      }

      const customCss = typeof event.data.customCss === "string" ? event.data.customCss : ""
      let style = document.getElementById("ssc-design-studio-preview-css") as HTMLStyleElement | null
      if (!style) {
        style = document.createElement("style")
        style.id = "ssc-design-studio-preview-css"
        document.head.appendChild(style)
      }
      style.textContent = customCss
      if (event.source && "postMessage" in event.source) {
        ;(event.source as Window).postMessage({ type: `${MESSAGE_TYPE}:ready` }, event.origin)
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  return null
}

export const DESIGN_STUDIO_THEME_MESSAGE = MESSAGE_TYPE
