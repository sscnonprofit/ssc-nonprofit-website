"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react"

export type GridPhoto = { id: number; url: string; alt: string; caption: string }

export function PhotoGrid({ photos, title }: { photos: GridPhoto[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const touchStart = useRef<number | null>(null)

  const close = useCallback(() => {
    setOpenIndex(null)
    returnFocus.current?.focus()
  }, [])
  const step = useCallback(
    (delta: number) => setOpenIndex((current) => (current === null ? current : (current + delta + photos.length) % photos.length)),
    [photos.length],
  )

  useEffect(() => {
    if (openIndex === null) return
    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
      if (event.key === "ArrowRight") step(1)
      if (event.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [openIndex, close, step])

  const current = openIndex === null ? null : photos[openIndex]

  return (
    <>
      <ul className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
        {photos.map((photo, index) => (
          <li key={photo.id} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={(event) => {
                returnFocus.current = event.currentTarget
                setOpenIndex(index)
              }}
              aria-label={`Open photo ${index + 1} of ${photos.length}${photo.caption ? `: ${photo.caption}` : ""}`}
              className="group block w-full overflow-hidden rounded-xl bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt || photo.caption || `${title} photo ${index + 1}`}
                loading="lazy"
                className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {current && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo viewer`}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
          onTouchStart={(event) => {
            touchStart.current = event.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return
            const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current
            if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1)
            touchStart.current = null
          }}
        >
          <div className="flex items-center justify-between p-4">
            <p className="font-mono text-xs tracking-widest" aria-live="polite">
              {openIndex + 1} / {photos.length}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close viewer"
              className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <XIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
            <Image
              key={current.id}
              src={current.url}
              alt={current.alt || current.caption || `${title} photo ${openIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
          {current.caption && <p className="p-4 text-center text-pretty text-sm text-white/90">{current.caption}</p>}
          {photos.length > 1 && (
            <div className="flex items-center justify-center gap-6 p-4 pb-6">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <ChevronLeftIcon className="size-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <ChevronRightIcon className="size-6" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
