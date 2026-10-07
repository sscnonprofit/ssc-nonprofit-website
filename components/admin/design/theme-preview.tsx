"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { DeviceFrame } from "@/components/admin/device-frame"
import type { ThemeSettings } from "@/lib/cms/theme"

const MESSAGE_TYPE = "ssc-design-studio-theme"

export function ThemePreview({ theme, width }: { theme: ThemeSettings; width: number | null }) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)

  const sendTheme = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage({ type: MESSAGE_TYPE, theme }, window.location.origin)
  }, [theme])

  useEffect(() => {
    if (loaded) sendTheme()
  }, [loaded, sendTheme])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow || event.data?.type !== `${MESSAGE_TYPE}:ready`) return
      setLoaded(true)
      sendTheme()
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [sendTheme])

  return (
    <DeviceFrame width={width ?? 1280}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-background shadow-xl">
        {!loaded && (
          <div role="status" className="absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
            Loading live site preview…
          </div>
        )}
        <iframe
          ref={frameRef}
          title="Live public site preview"
          src="/?designStudioPreview=1"
          onLoad={() => setLoaded(true)}
          className="block h-[780px] w-full border-0 bg-background"
        />
      </div>
    </DeviceFrame>
  )
}
