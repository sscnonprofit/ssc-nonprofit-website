"use client"

import { useState, type ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"

import {
  countEmptyFields,
  countFields,
  humanizeKey,
  inferFieldKind,
  valueMatchesQuery,
  type FieldKind,
} from "@/lib/cms/field-utils"
import { cn } from "@/lib/utils"
import { PrimitiveField } from "@/components/admin/visual-editor/primitive-field"
import { ArrayField } from "@/components/admin/visual-editor/array-field"
import { EditorQueryContext, useEditorQuery } from "@/components/admin/visual-editor/editor-context"

const HALF_WIDTH_KINDS: FieldKind[] = ["text", "number"]

/** Recursively renders every key of a plain object as a labeled field, dispatching to the right widget by inferred kind. */
export function ObjectFields({
  data,
  onChange,
  depth = 0,
}: {
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  depth?: number
}) {
  const query = useEditorQuery()
  const needle = query.trim().toLowerCase()

  function setKey(key: string, value: unknown) {
    onChange({ ...data, [key]: value })
  }

  const entries = Object.entries(data).filter(([key, value]) => valueMatchesQuery(key, value, query))

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No fields match your search.</p>
  }

  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      {entries.map(([key, value]) => {
        const kind = inferFieldKind(key, value)
        const label = humanizeKey(key)
        // When a group's own name matches the search, show everything inside it.
        const showAllInside = needle !== "" && label.toLowerCase().includes(needle)
        const scope = (node: ReactNode) =>
          showAllInside ? <EditorQueryContext.Provider value="">{node}</EditorQueryContext.Provider> : node

        if (kind === "object") {
          return (
            <div key={key} className="sm:col-span-2">
              {scope(
                <NestedPanel label={label} value={value} depth={depth}>
                  <ObjectFields data={value as Record<string, unknown>} onChange={(next) => setKey(key, next)} depth={depth + 1} />
                </NestedPanel>
              )}
            </div>
          )
        }

        if (kind === "array-primitive" || kind === "array-object") {
          return (
            <div key={key} className="sm:col-span-2">
              {scope(<ArrayField label={label} items={value as unknown[]} onChange={(next) => setKey(key, next)} depth={depth} />)}
            </div>
          )
        }

        return (
          <div key={key} className={HALF_WIDTH_KINDS.includes(kind) ? undefined : "sm:col-span-2"}>
            <PrimitiveField label={label} kind={kind} value={value} onChange={(next) => setKey(key, next)} />
          </div>
        )
      })}
    </div>
  )
}

function NestedPanel({
  label,
  value,
  depth,
  children,
}: {
  label: string
  value: unknown
  depth: number
  children: ReactNode
}) {
  const query = useEditorQuery()
  const [open, setOpen] = useState(depth < 3)
  const isOpen = open || query.trim() !== ""
  const total = countFields(value)
  const empty = countEmptyFields(value)

  return (
    <section className={cn("overflow-hidden rounded-xl border border-border", depth % 2 === 0 ? "bg-muted/20" : "bg-background")}>
      <h4>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60"
        >
          <span className="truncate text-sm font-semibold text-foreground">{label}</span>
          <span className="flex shrink-0 items-center gap-2.5 text-xs text-muted-foreground">
            {empty > 0 && <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">{empty} empty</span>}
            <span className="tabular-nums">
              {total} {total === 1 ? "field" : "fields"}
            </span>
            <ChevronDownIcon className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
          </span>
        </button>
      </h4>
      <div hidden={!isOpen} className="border-t border-border p-4">
        {children}
      </div>
    </section>
  )
}
