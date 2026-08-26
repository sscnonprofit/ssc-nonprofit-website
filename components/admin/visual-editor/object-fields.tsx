"use client"

import { humanizeKey, inferFieldKind } from "@/lib/cms/field-utils"
import { PrimitiveField } from "@/components/admin/visual-editor/primitive-field"
import { ArrayField } from "@/components/admin/visual-editor/array-field"

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
    <div className={depth === 0 ? "space-y-5" : "space-y-4"}>
      {Object.entries(data).map(([key, value]) => {
        const kind = inferFieldKind(key, value)
        const label = humanizeKey(key)

        if (kind === "object") {
          return (
            <div key={key} className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">{label}</p>
              <ObjectFields data={value as Record<string, unknown>} onChange={(next) => setKey(key, next)} depth={depth + 1} />
            </div>
          )
        }

        if (kind === "array-primitive" || kind === "array-object") {
          return (
            <ArrayField
              key={key}
              label={label}
              items={value as unknown[]}
              onChange={(next) => setKey(key, next)}
              depth={depth}
            />
          )
        }

        return <PrimitiveField key={key} label={label} kind={kind} value={value} onChange={(next) => setKey(key, next)} />
      })}
    </div>
  )
}
