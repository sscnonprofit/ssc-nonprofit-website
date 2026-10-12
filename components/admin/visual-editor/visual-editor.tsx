"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDownIcon, ChevronsDownUpIcon, ChevronsUpDownIcon, SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ObjectFields } from "@/components/admin/visual-editor/object-fields"
import { ArrayField } from "@/components/admin/visual-editor/array-field"
import { EditorQueryContext } from "@/components/admin/visual-editor/editor-context"
import { SectionIcon, type SectionKind } from "@/components/admin/visual-editor/section-icon"
import { countEmptyFields, countFields, humanizeKey, inferFieldKind, valueMatchesQuery } from "@/lib/cms/field-utils"
import { cn } from "@/lib/utils"

type Section = {
  id: string
  label: string
  count: number
  unit: string
  /** Top-level key this section edits, or null for the grouped "General" fields. */
  key: string | null
  kind: SectionKind
  empty: number
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
      sections.push({
        id: `section-${key}`,
        label: humanizeKey(key),
        count: Object.keys(value as object).length,
        unit: "field",
        key,
        kind: "object",
        empty: countEmptyFields(value),
      })
    } else if (kind === "array-object" || kind === "array-primitive") {
      sections.push({
        id: `section-${key}`,
        label: humanizeKey(key),
        count: (value as unknown[]).length,
        unit: "item",
        key,
        kind: "list",
        empty: countEmptyFields(value),
      })
    } else {
      general[key] = value
    }
  }

  const generalCount = Object.keys(general).length
  if (generalCount > 0) {
    sections.unshift({
      id: GENERAL_ID,
      label: "General",
      count: generalCount,
      unit: "field",
      key: null,
      kind: "general",
      empty: countEmptyFields(general),
    })
  }
  return { sections, general }
}

/**
 * Renders any page's JSON content as an editable form, inferring field types
 * (text, textarea, number, boolean, image, sortable arrays, nested objects)
 * purely from the shape of the data. No per-page schema needed.
 *
 * Each top-level group becomes its own collapsible section. A search box filters
 * every section, field and list item at once, and a sticky rail shows progress
 * and lets editors jump straight to a group.
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

  const [query, setQuery] = useState("")
  const searching = query.trim() !== ""
  const needle = query.trim().toLowerCase()

  const visibleSections = useMemo(
    () =>
      sections.filter((section) => {
        const value = section.key === null ? general : content[section.key]
        return valueMatchesQuery(section.key ?? "", value, query)
      }),
    [sections, general, content, query]
  )
  const visibleIds = visibleSections.map((s) => s.id).join("|")

  const [open, setOpen] = useState<Record<string, boolean>>(() => (sections[0] ? { [sections[0].id]: true } : {}))
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null)

  useEffect(() => {
    if (!visibleIds) return
    const elements = visibleIds
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
  }, [visibleIds])

  if (!isEditable) {
    return <p className="text-sm text-muted-foreground">This page&apos;s content isn&apos;t a plain object and can&apos;t be edited visually. Use the JSON tab instead.</p>
  }

  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">This page has no content fields yet.</p>
  }

  const totalFields = countFields(content)
  const emptyFields = countEmptyFields(content)
  const completion = totalFields === 0 ? 100 : Math.round(((totalFields - emptyFields) / totalFields) * 100)
  const allOpen = visibleSections.every((s) => open[s.id])

  function setAll(value: boolean) {
    setOpen((current) => ({ ...current, ...Object.fromEntries(visibleSections.map((s) => [s.id, value])) }))
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
    <EditorQueryContext.Provider value={query}>
      <div className="grid gap-6 lg:grid-cols-[14.5rem_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Editor overview">
          <div className="sticky top-28 flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Content filled in</p>
                <p className="font-serif text-xl font-semibold tabular-nums text-foreground">{completion}%</p>
              </div>
              <div
                role="progressbar"
                aria-label="Content filled in"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completion}
                className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${completion}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {emptyFields === 0 ? "Every text field has content." : `${pluralize(emptyFields, "text field")} still empty.`}
              </p>
            </div>

            <nav aria-label="Page sections" className="flex flex-col gap-0.5">
              <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sections</p>
              {visibleSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => jumpTo(section.id)}
                  aria-current={activeId === section.id ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                    activeId === section.id
                      ? "bg-primary/10 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <SectionIcon sectionKey={section.key} kind={section.kind} className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{section.label}</span>
                  {section.empty > 0 && (
                    <span className="shrink-0 rounded-full bg-muted px-1.5 text-xs tabular-nums text-foreground" title={`${section.empty} empty`}>
                      {section.empty}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-52 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                placeholder="Search every field, heading and list item"
                aria-label="Search page content"
                className="h-10 pl-9 pr-9"
              />
              {searching && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>
            {!searching && (
              <Button type="button" size="lg" variant="outline" onClick={() => setAll(!allOpen)}>
                {allOpen ? <ChevronsDownUpIcon className="size-4" /> : <ChevronsUpDownIcon className="size-4" />}
                {allOpen ? "Collapse all" : "Expand all"}
              </Button>
            )}
          </div>

          <nav aria-label="Page sections" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
            {visibleSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => jumpTo(section.id)}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
                  activeId === section.id
                    ? "border-primary/40 bg-primary/10 font-medium text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <SectionIcon sectionKey={section.key} kind={section.kind} className="size-3.5" />
                {section.label}
              </button>
            ))}
          </nav>

          {searching && (
            <p className="text-sm text-muted-foreground" role="status">
              {visibleSections.length === 0
                ? `Nothing matches "${query.trim()}".`
                : `Showing matches in ${pluralize(visibleSections.length, "section")}.`}
            </p>
          )}

          {visibleSections.map((section) => {
            const isOpen = searching || Boolean(open[section.id])
            const isActive = activeId === section.id
            const bodyId = `${section.id}-body`
            const labelMatches = searching && section.label.toLowerCase().includes(needle)
            return (
              <section
                key={section.id}
                id={section.id}
                onFocusCapture={() => setActiveId(section.id)}
                className={cn(
                  "scroll-mt-28 overflow-hidden rounded-2xl border bg-card shadow-xs transition-[border-color,box-shadow]",
                  isActive && isOpen ? "border-primary/40 ring-4 ring-primary/10" : "border-border hover:border-foreground/25"
                )}
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(section.id)}
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    className={cn(
                      "flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 sm:px-5",
                      isOpen && "border-b border-border bg-muted/40"
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <SectionIcon sectionKey={section.key} kind={section.kind} className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-serif text-lg font-semibold leading-tight text-foreground">{section.label}</span>
                      <span className="text-xs text-muted-foreground">{pluralize(section.count, section.unit)}</span>
                    </span>
                    {section.empty > 0 && (
                      <span className="hidden shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground sm:inline">
                        {section.empty} empty
                      </span>
                    )}
                    <ChevronDownIcon className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                </h3>
                <div id={bodyId} hidden={!isOpen} className="p-4 sm:p-5">
                  <EditorQueryContext.Provider value={labelMatches ? "" : query}>
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
                  </EditorQueryContext.Provider>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </EditorQueryContext.Provider>
  )
}
