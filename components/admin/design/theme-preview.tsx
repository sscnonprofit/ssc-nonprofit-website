"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { themeToVars, type ThemeSettings } from "@/lib/cms/theme"
import { cn } from "@/lib/utils"

const MESSAGE_TYPE = "ssc-design-studio-theme"

export function ThemePreview({ theme, width }: { theme: ThemeSettings; width: number | null }) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)
  const vars = themeToVars(theme, { allColors: true }) as Record<string, string>

  const sendTheme = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: MESSAGE_TYPE, vars, customCss: theme.customCss },
      window.location.origin,
    )
  }, [theme, vars])

  useEffect(() => {
    if (!loaded) return
    sendTheme()
  }, [loaded, sendTheme])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== `${MESSAGE_TYPE}:ready`) return
      sendTheme()
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [sendTheme])

  return (
    <div className="mx-auto flex justify-center">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-background shadow-xl transition-[width] duration-300",
          width === null ? "w-full" : "max-w-full",
        )}
        style={{ width: width ?? "100%" }}
      >
        {!loaded && (
          <div className="absolute inset-0 z-10 flex min-h-[70vh] items-center justify-center bg-muted/70 text-sm text-muted-foreground">
            Loading live site preview…
          </div>
        )}
        <iframe
          ref={frameRef}
          title="Live public site preview"
          src="/?designStudioPreview=1"
          onLoad={() => setLoaded(true)}
          className="block h-[calc(100dvh-12rem)] min-h-[640px] w-full border-0 bg-background"
        />
      </div>
    </div>
  )
}
