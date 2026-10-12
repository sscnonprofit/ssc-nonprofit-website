"use client"

import { humanizeKey, inferFieldKind, type FieldKind } from "@/lib/cms/field-utils"
import { PrimitiveField } from "@/components/admin/visual-editor/primitive-field"
import { ArrayField } from "@/components/admin/visual-editor/array-field"

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
  function setKey(key: string, value: unknown) {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Object.entries(data).map(([key, value]) => {
        const kind = inferFieldKind(key, value)
        const label = humanizeKey(key)

        if (kind === "object") {
          const fieldCount = Object.keys(value as Record<string, unknown>).length
          return (
            <section key={key} className="overflow-hidden rounded-lg border border-border bg-background sm:col-span-2">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-2">
                <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                <span className="text-xs text-muted-foreground">
                  {fieldCount} {fieldCount === 1 ? "field" : "fields"}
                </span>
              </div>
              <div className="p-4">
                <ObjectFields data={value as Record<string, unknown>} onChange={(next) => setKey(key, next)} depth={depth + 1} />
              </div>
            </section>
          )
        }

        if (kind === "array-primitive" || kind === "array-object") {
          return (
            <div key={key} className="sm:col-span-2">
              <ArrayField label={label} items={value as unknown[]} onChange={(next) => setKey(key, next)} depth={depth} />
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
