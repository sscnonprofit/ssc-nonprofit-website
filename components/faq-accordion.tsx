"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

export type Faq = { q: string; a: string }

export function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <li key={item.q} className="overflow-hidden rounded-xl border border-border bg-card">
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary"
              >
                <span className="font-display font-semibold">{item.q}</span>
                <Plus
                  className={cn(
                    "size-5 shrink-0 text-primary transition-transform duration-200",
                    isOpen && "rotate-45",
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div id={`faq-panel-${i}`} hidden={!isOpen} className="border-t border-border px-5 py-4">
              <p className="text-pretty leading-relaxed text-muted-foreground">{item.a}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
