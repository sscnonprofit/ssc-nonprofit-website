"use client"

import { useId, useState } from "react"
import { RotateCcwIcon, WandSparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { FONT_OPTIONS, contrastRatio, contrastRating, readableOn, type FontKey } from "@/lib/cms/theme"
import { cn } from "@/lib/utils"

const HEX = /^#[0-9a-f]{6}$/i

export function ControlGroup({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-border py-5 last:border-b-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function ColorField({
  label,
  hint,
  value,
  defaultValue,
  pairValue,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  defaultValue: string
  pairValue?: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const [text, setText] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setText(value)
  }

  const ratio = pairValue ? contrastRatio(value, pairValue) : null
  const rating = ratio ? contrastRating(ratio) : null

  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
      <label
        className="relative row-span-2 size-11 cursor-pointer overflow-hidden rounded-md border border-border shadow-sm"
        style={{ backgroundColor: value }}
      >
        <span className="sr-only">Pick {label}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {hint && <span className="truncate text-sm text-muted-foreground">{hint}</span>}
      </div>
      {rating && (
        <span
          title={`Contrast ${ratio?.toFixed(2)}:1`}
          className={cn(
            "col-start-2 row-start-3 w-fit rounded px-2 py-1 text-sm font-semibold",
            rating === "Fail"
              ? "bg-destructive/15 text-destructive"
              : rating === "AA Large"
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary",
          )}
        >
          {rating}
        </span>
      )}
      <Input
        id={id}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          if (HEX.test(e.target.value)) onChange(e.target.value.toLowerCase())
        }}
        onBlur={() => setText(value)}
        className="col-start-2 row-start-2 h-11 w-full"
        spellCheck={false}
        aria-label={`${label} hex value`}
      />
      {pairValue && rating === "Fail" ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="col-start-3 row-start-1 row-span-3 size-11"
          title="Pick a readable color"
          onClick={() => onChange(readableOn(pairValue))}
        >
          <WandSparklesIcon className="size-4" />
          <span className="sr-only">Pick a readable color for {label}</span>
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="col-start-3 row-start-1 row-span-3 size-11"
          disabled={value === defaultValue}
          title="Reset to default"
          onClick={() => onChange(defaultValue)}
        >
          <RotateCcwIcon className="size-3.5" />
          <span className="sr-only">Reset {label}</span>
        </Button>
      )}
    </div>
  )
}

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  format = (v) => String(v),
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-sm text-muted-foreground">{format(value)}</span>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className={cn("gap-1 rounded-lg bg-muted p-1", options.length > 3 ? "grid grid-cols-2" : "flex")}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-11 min-w-0 flex-1 rounded-md px-2 py-2 text-sm font-medium transition-colors",
              value === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description && <span className="text-sm text-muted-foreground">{description}</span>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function FontPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: FontKey
  onChange: (value: FontKey) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
        {FONT_OPTIONS.map((font) => (
          <button
            key={font.key}
            type="button"
            role="radio"
            aria-checked={value === font.key}
            onClick={() => onChange(font.key)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
              value === font.key
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-foreground/30",
            )}
          >
            <span className="text-lg leading-none text-foreground" style={{ fontFamily: `var(${font.cssVar})` }}>
              Aa
            </span>
            <span className="truncate text-sm text-muted-foreground">{font.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
