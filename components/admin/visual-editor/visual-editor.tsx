"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDownIcon, ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ObjectFields } from "@/components/admin/visual-editor/object-fields"
import { ArrayField } from "@/components/admin/visual-editor/array-field"
import { humanizeKey, inferFieldKind } from "@/lib/cms/field-utils"
import { cn } from "@/lib/utils"

type Section = {
  id: string
  label: string
  count: number
  unit: string
  /** Top-level key this section edits, or null for the grouped "General" fields. */
  key: string | null
}

const GENERAL_ID = "section-general"

function pluralize(count: number, unit: string) {
  return `${count} ${count === 1 ? unit : `${unit}s`}`
}

function buildSections(content: Record<string, unknown>): { sections: Section[]; general: Record<string, unknown> } {
  const general: Record<string, unknown> = {}
  const sections: Section[] = []

  for (const [key, value] of Object.entries(content)) {
    const kind = inferFieldKind(key, value)
    if (kind === "object") {
      sections.push({ id: `section-${key}`, label: humanizeKey(key), count: Object.keys(value as object).length, unit: "field", key })
    } else if (kind === "array-object" || kind === "array-primitive") {
      sections.push({ id: `section-${key}`, label: humanizeKey(key), count: (value as unknown[]).length, unit: "item", key })
    } else {
      general[key] = value
    }
  }

  const generalCount = Object.keys(general).length
  if (generalCount > 0) {
    sections.unshift({ id: GENERAL_ID, label: "General", count: generalCount, unit: "field", key: null })
  }
  return { sections, general }
}

/**
 * Renders any page's JSON content as an editable form, inferring field types
 * (text, textarea, number, boolean, image, sortable arrays, nested objects)
 * purely from the shape of the data. No per-page schema needed.
 *
 * Each top-level group becomes its own collapsible section, with a sticky
 * "Jump to" list so long pages are quick to navigate.
 */
export function VisualEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const isEditable = Boolean(content) && typeof content === "object" && !Array.isArray(content)
  const { sections, general } = useMemo(() => buildSections(isEditable ? content : {}), [content, isEditable])
  const sectionIds = sections.map((s) => s.id).join("|")

  const [open, setOpen] = useState<Record<string, boolean>>(() => (sections[0] ? { [sections[0].id]: true } : {}))
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null)

  useEffect(() => {
    if (!sectionIds) return
    const elements = sectionIds
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: "-130px 0px -60% 0px" }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sectionIds])

  if (!isEditable) {
    return <p className="text-sm text-muted-foreground">This page&apos;s content isn&apos;t a plain object and can&apos;t be edited visually. Use the JSON tab instead.</p>
  }

  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">This page has no content fields yet.</p>
  }

  const allOpen = sections.every((s) => open[s.id])

  function setAll(value: boolean) {
    setOpen(Object.fromEntries(sections.map((s) => [s.id, value])))
  }

  function toggle(id: string) {
    setOpen((current) => ({ ...current, [id]: !current[id] }))
  }

  function jumpTo(id: string) {
    setOpen((current) => ({ ...current, [id]: true }))
    setActiveId(id)
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  function setKey(key: string, value: unknown) {
    onChange({ ...content, [key]: value })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="Page sections" className="hidden lg:block">
        <div className="sticky top-28 flex flex-col gap-1">
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jump to</p>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => jumpTo(section.id)}
              aria-current={activeId === section.id ? "true" : undefined}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                activeId === section.id
                  ? "bg-primary/10 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="truncate">{section.label}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{section.count}</span>
            </button>
          ))}
          <Button type="button" size="sm" variant="ghost" className="mt-2 justify-start" onClick={() => setAll(!allOpen)}>
            {allOpen ? <ChevronsDownUpIcon className="size-3.5" /> : <ChevronsUpDownIcon className="size-3.5" />}
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <p className="text-sm text-muted-foreground">{pluralize(sections.length, "section")}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => setAll(!allOpen)}>
            {allOpen ? <ChevronsDownUpIcon className="size-3.5" /> : <ChevronsUpDownIcon className="size-3.5" />}
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        </div>

        {sections.map((section) => {
          const isOpen = Boolean(open[section.id])
          const bodyId = `${section.id}-body`
          return (
            <section
              key={section.id}
              id={section.id}
              className={cn(
                "scroll-mt-28 overflow-hidden rounded-xl border bg-card shadow-xs transition-colors",
                isOpen ? "border-border" : "border-border hover:border-foreground/25"
              )}
            >
              <h3>
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  aria-expanded={isOpen}
                  aria-controls={bodyId}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50",
                    isOpen && "border-b border-border bg-muted/40"
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-serif text-lg font-semibold text-foreground">{section.label}</span>
                    <span className="text-xs text-muted-foreground">{pluralize(section.count, section.unit)}</span>
                  </span>
                  <ChevronDownIcon className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>
              </h3>
              <div id={bodyId} hidden={!isOpen} className="p-4 sm:p-5">
                {section.key === null ? (
                  <ObjectFields data={general} onChange={(next) => onChange({ ...content, ...next })} depth={1} />
                ) : Array.isArray(content[section.key]) ? (
                  <ArrayField
                    embedded
                    label={section.label}
                    items={content[section.key] as unknown[]}
                    onChange={(next) => setKey(section.key as string, next)}
                    depth={1}
                  />
                ) : (
                  <ObjectFields
                    data={content[section.key] as Record<string, unknown>}
                    onChange={(next) => setKey(section.key as string, next)}
                    depth={1}
                  />
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
