"use client"

import { useId } from "react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ImageField } from "@/components/admin/image-field"
import type { FieldKind } from "@/lib/cms/field-utils"

export function PrimitiveField({
  label,
  kind,
  value,
  onChange,
  compact = false,
}: {
  label: string
  kind: FieldKind
  value: unknown
  onChange: (value: unknown) => void
  compact?: boolean
}) {
  const id = useId()

  if (kind === "image") {
    return <ImageField label={label} value={typeof value === "string" ? value : ""} onChange={onChange} />
  }

  if (kind === "boolean") {
    return (
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background px-3.5 py-3 transition-colors hover:bg-muted/50"
      >
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
      </label>
    )
  }

  const text = typeof value === "string" ? value : ""
  const isTextual = kind === "text" || kind === "textarea"
  const isEmpty = isTextual && text.trim() === ""

  const heading = !compact && (
    <div className="flex items-baseline justify-between gap-2">
      <Label htmlFor={id} className="text-[13px] font-medium text-foreground">
        {label}
      </Label>
      {isEmpty && <span className="text-xs text-muted-foreground">Empty</span>}
    </div>
  )

  if (kind === "number") {
    return (
      <div className="space-y-1.5">
        {heading}
        <Input
          id={id}
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>
    )
  }

  if (kind === "textarea") {
    return (
      <div className="space-y-1.5">
        {heading}
        <Textarea
          id={id}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="min-h-24 resize-y leading-relaxed"
        />
        <p className="text-right text-xs tabular-nums text-muted-foreground">{text.length} characters</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {heading}
      <Input id={id} value={text} onChange={(e) => onChange(e.target.value)} placeholder={compact ? label : undefined} />
    </div>
  )
}
