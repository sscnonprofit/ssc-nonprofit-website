"use client"

import { useSyncExternalStore, useState } from "react"
import Link from "next/link"
import { ArrowRight, X } from "lucide-react"

import type { ThemeSettings } from "@/lib/cms/theme"
import { cn } from "@/lib/utils"

const toneClasses = {
  brand: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  neutral: "bg-secondary text-secondary-foreground border-b border-border",
} as const

function storageKey(text: string) {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0
  return `ssc-announcement-${hash}`
}

const subscribe = () => () => {}

export function SiteAnnouncement({ announcement }: { announcement: ThemeSettings["announcement"] }) {
  const key = storageKey(announcement.text)
  const dismissedStored = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(key) === "1",
    () => false,
  )
  const [dismissed, setDismissed] = useState(false)

  if (!announcement.enabled || !announcement.text || dismissed || dismissedStored) return null

  const content = (
    <span className="inline-flex items-center gap-2 text-pretty">
      {announcement.text}
      {announcement.href && <ArrowRight className="size-4 shrink-0" aria-hidden="true" />}
    </span>
  )

  return (
    <div role="region" aria-label="Announcement" className={cn("relative text-sm font-medium", toneClasses[announcement.tone])}>
      <div className="mx-auto flex max-w-7xl items-center justify-center px-12 py-2.5 text-center">
        {announcement.href ? (
          announcement.href.startsWith("/") ? (
            <Link href={announcement.href} className="underline-offset-4 hover:underline">
              {content}
            </Link>
          ) : (
            <a href={announcement.href} className="underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          )
        ) : (
          content
        )}
      </div>
      {announcement.dismissible && (
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(key, "1")
            setDismissed(true)
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-80 transition-opacity hover:opacity-100"
          aria-label="Dismiss announcement"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
