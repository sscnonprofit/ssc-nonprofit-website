"use client"

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
  if (kind === "image") {
    return <ImageField label={label} value={typeof value === "string" ? value : ""} onChange={onChange} />
  }

  if (kind === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
        <Label className="text-sm font-medium">{label}</Label>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    )
  }

  if (kind === "number") {
    return (
      <div className="space-y-1.5">
        {!compact && <Label className="text-sm font-medium">{label}</Label>}
        <Input
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
        {!compact && <Label className="text-sm font-medium">{label}</Label>}
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {!compact && <Label className="text-sm font-medium">{label}</Label>}
      <Input value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} placeholder={compact ? label : undefined} />
    </div>
  )
}
