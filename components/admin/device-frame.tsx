"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

export function DeviceFrame({ width, children }: { width: number; children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState<number | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => setAvailableWidth(container.clientWidth))
    observer.observe(container)
    setAvailableWidth(container.clientWidth)
    return () => observer.disconnect()
  }, [])

  const scale = availableWidth === null ? 1 : Math.min(1, availableWidth / width)

  return (
    <div ref={containerRef} className="min-w-0 w-full">
      <div className="mx-auto" style={{ width: availableWidth === null ? "100%" : width * scale }}>
        <div style={{ width: availableWidth === null ? "100%" : width, zoom: scale }}>
          {children}
        </div>
      </div>
    </div>
  )
}
