"use client"

import { useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  CopyIcon,
  ImagesIcon,
  MonitorIcon,
  MousePointerClickIcon,
  PlusIcon,
  SmartphoneIcon,
  TabletIcon,
  Trash2Icon,
} from "lucide-react"

import { ColorField, ControlGroup, Segmented, SliderField, ToggleField } from "@/components/admin/design/controls"
import { ImageField } from "@/components/admin/image-field"
import { MediaGrid } from "@/components/admin/media/media-grid"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BLOCK_MAP } from "@/lib/builder/registry"
import { DEFAULT_STYLE, type ListField, type ScalarField, type Section, type SectionStyle } from "@/lib/builder/schema"
import { cn } from "@/lib/utils"

import { setPath, type Builder } from "./use-builder"

const BG_SWATCHES: { value: SectionStyle["background"]; label: string; swatch: string }[] = [
  { value: "default", label: "Page", swatch: "var(--background)" },
  { value: "muted", label: "Soft", swatch: "var(--muted)" },
  { value: "card", label: "Card", swatch: "var(--card)" },
  { value: "primary", label: "Brand", swatch: "var(--primary)" },
  { value: "accent", label: "Accent", swatch: "var(--accent)" },
  { value: "dark", label: "Dark", swatch: "color-mix(in oklab, var(--foreground) 92%, var(--primary))" },
  { value: "custom", label: "Custom", swatch: "conic-gradient(#e11d48, #f59e0b, #16a34a, #2563eb, #e11d48)" },
  { value: "image", label: "Image", swatch: "repeating-linear-gradient(45deg, var(--muted) 0 4px, var(--border) 4px 8px)" },
]

function ImageWithLibrary({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <ImageField label={label} value={value} onChange={onChange} />
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ImagesIcon className="size-4" />
        Choose from library
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Media library</DialogTitle>
            <DialogDescription>Pick an image or upload new ones.</DialogDescription>
          </DialogHeader>
          <MediaGrid
            selectedUrl={value}
            onPick={(url) => {
              onChange(url)
              setOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ScalarInput({ field, value, onChange }: { field: ScalarField; value: string; onChange: (v: string) => void }) {
  if (field.type === "image") return <ImageWithLibrary label={field.label} value={value} onChange={onChange} />
  if (field.type === "select" && field.options) {
    return field.options.length <= 4 ? (
      <Segmented label={field.label} value={value} options={field.options} onChange={onChange} />
    ) : (
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">{field.label}</Label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
  const id = `f-${field.key}`
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs">
          {field.label}
        </Label>
        {field.max && field.type === "textarea" && (
          <span className="font-mono text-[10px] text-muted-foreground">
            {value.length}/{field.max}
          </span>
        )}
      </div>
      {field.type === "textarea" ? (
        <Textarea id={id} value={value} maxLength={field.max} placeholder={field.placeholder} rows={4} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input
          id={id}
          type={field.type === "url" ? "url" : "text"}
          value={value}
          maxLength={field.max}
          placeholder={field.placeholder ?? (field.type === "url" ? "/contact or https://..." : undefined)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

function ListEditor({ field, items, onChange }: { field: ListField; items: Record<string, unknown>[]; onChange: (items: Record<string, unknown>[]) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
    setOpen(to)
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{field.label}</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {items.length}/{field.max}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, index) => {
          const title = String(item[field.fields[0]?.key] ?? "") || `${field.itemLabel} ${index + 1}`
          const isOpen = open === index
          return (
            <li key={index} className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-1 pr-1">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm"
                >
                  <ChevronDownIcon className={cn("size-3.5 shrink-0 transition-transform", !isOpen && "-rotate-90")} />
                  <span className="truncate">{title}</span>
                </button>
                <Button type="button" size="icon" variant="ghost" className="size-7" disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUpIcon className="size-3.5" />
                  <span className="sr-only">Move up</span>
                </Button>
                <Button type="button" size="icon" variant="ghost" className="size-7" disabled={index === items.length - 1} onClick={() => move(index, index + 1)}>
                  <ArrowDownIcon className="size-3.5" />
                  <span className="sr-only">Move down</span>
                </Button>
                <Button type="button" size="icon" variant="ghost" className="size-7 text-destructive" onClick={() => onChange(items.filter((_, i) => i !== index))}>
                  <Trash2Icon className="size-3.5" />
                  <span className="sr-only">Remove {field.itemLabel}</span>
                </Button>
              </div>
              {isOpen && (
                <div className="flex flex-col gap-3 border-t border-border p-3">
                  {field.fields.map((sub) => (
                    <ScalarInput
                      key={sub.key}
                      field={sub}
                      value={String(item[sub.key] ?? "")}
                      onChange={(v) => onChange(items.map((it, i) => (i === index ? { ...it, [sub.key]: v } : it)))}
                    />
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={items.length >= field.max}
        onClick={() => {
          const blank = Object.fromEntries(field.fields.map((f) => [f.key, f.options?.[0]?.value ?? ""]))
          onChange([...items, blank])
          setOpen(items.length)
        }}
      >
        <PlusIcon className="size-4" />
        Add {field.itemLabel.toLowerCase()}
      </Button>
    </div>
  )
}

function ContentTab({ section, builder }: { section: Section; builder: Builder }) {
  const def = BLOCK_MAP[section.type]
  const set = (key: string, value: unknown) => builder.updateSection(section.id, (s) => ({ ...s, props: setPath(s.props, key, value) }))
  return (
    <div className="flex flex-col gap-5 py-4">
      {def.variants.length > 1 && (
        <Segmented
          label="Layout"
          value={section.variant}
          options={def.variants}
          onChange={(variant) => builder.updateSection(section.id, (s) => ({ ...s, variant }))}
        />
      )}
      {def.fields.map((field) =>
        field.type === "list" ? (
          <ListEditor
            key={field.key}
            field={field}
            items={(section.props[field.key] as Record<string, unknown>[]) ?? []}
            onChange={(items) => set(field.key, items)}
          />
        ) : (
          <ScalarInput key={field.key} field={field} value={String(section.props[field.key] ?? "")} onChange={(v) => set(field.key, v)} />
        ),
      )}
      <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
        <MousePointerClickIcon className="mt-0.5 size-3.5 shrink-0" />
        Tip: click any text on the canvas to edit it in place.
      </p>
    </div>
  )
}

function DesignTab({ section, builder }: { section: Section; builder: Builder }) {
  const { style } = section
  const setStyle = (patch: Partial<SectionStyle>) => builder.updateSection(section.id, (s) => ({ ...s, style: { ...s.style, ...patch } }))
  const heroBackground = section.type === "hero" && section.variant === "background"
  return (
    <div className="flex flex-col">
      <ControlGroup title="Background">
        <div role="radiogroup" aria-label="Background" className="grid grid-cols-4 gap-2">
          {BG_SWATCHES.map((bg) => (
            <button
              key={bg.value}
              type="button"
              role="radio"
              aria-checked={style.background === bg.value}
              onClick={() => setStyle({ background: bg.value })}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border border-border p-2 text-[11px] font-medium transition-colors hover:bg-muted",
                style.background === bg.value && "border-primary ring-1 ring-primary",
              )}
            >
              <span className="size-6 rounded-full border border-border" style={{ background: bg.swatch }} />
              {bg.label}
            </button>
          ))}
        </div>
        {style.background === "custom" && (
          <ColorField label="Custom color" value={style.bgColor} defaultValue={DEFAULT_STYLE.bgColor} onChange={(bgColor) => setStyle({ bgColor })} />
        )}
        {style.background === "image" && <ImageWithLibrary label="Background image" value={style.bgImage} onChange={(bgImage) => setStyle({ bgImage })} />}
        {(style.background === "image" || heroBackground) && (
          <SliderField label="Image darkening" value={style.overlay} min={0} max={90} step={5} format={(v) => `${v}%`} onChange={(overlay) => setStyle({ overlay })} />
        )}
        <Segmented
          label="Text color"
          value={style.text}
          options={[
            { value: "auto", label: "Auto" },
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
          ]}
          onChange={(text) => setStyle({ text })}
        />
      </ControlGroup>
      <ControlGroup title="Layout">
        <Segmented
          label="Spacing"
          value={style.paddingY}
          options={[
            { value: "none", label: "0" },
            { value: "sm", label: "S" },
            { value: "md", label: "M" },
            { value: "lg", label: "L" },
            { value: "xl", label: "XL" },
          ]}
          onChange={(paddingY) => setStyle({ paddingY })}
        />
        <Segmented
          label="Content width"
          value={style.width}
          options={[
            { value: "narrow", label: "Narrow" },
            { value: "normal", label: "Normal" },
            { value: "wide", label: "Wide" },
            { value: "full", label: "Full" },
          ]}
          onChange={(width) => setStyle({ width })}
        />
        <Segmented
          label="Alignment"
          value={style.align}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
          ]}
          onChange={(align) => setStyle({ align })}
        />
        <ToggleField label="Top divider line" checked={style.divider} onChange={(divider) => setStyle({ divider })} />
      </ControlGroup>
      <ControlGroup title="Motion" description="Plays once as visitors scroll the section into view. Respects reduced-motion settings.">
        <Segmented
          label="Entrance"
          value={style.animation}
          options={[
            { value: "none", label: "None" },
            { value: "fade", label: "Fade" },
            { value: "slide-up", label: "Slide up" },
          ]}
          onChange={(animation) => setStyle({ animation })}
        />
      </ControlGroup>
    </div>
  )
}

function SettingsTab({ section, builder }: { section: Section; builder: Builder }) {
  const def = BLOCK_MAP[section.type]
  const patch = (p: Partial<Section>) => builder.updateSection(section.id, (s) => ({ ...s, ...p }))
  const devices = [
    { key: "desktop", label: "Desktop", icon: MonitorIcon },
    { key: "tablet", label: "Tablet", icon: TabletIcon },
    { key: "mobile", label: "Mobile", icon: SmartphoneIcon },
  ] as const
  return (
    <div className="flex flex-col">
      <ControlGroup title="Identity">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="section-label" className="text-xs">
            Layer name
          </Label>
          <Input id="section-label" value={section.label} placeholder={def.label} maxLength={60} onChange={(e) => patch({ label: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="section-anchor" className="text-xs">
            Anchor link
          </Label>
          <Input
            id="section-anchor"
            value={section.anchor}
            placeholder="e.g. tours"
            maxLength={40}
            onChange={(e) => patch({ anchor: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
          />
          <span className="text-[11px] text-muted-foreground">
            {section.anchor ? `Link to this section with #${section.anchor}` : "Lets buttons jump straight to this section."}
          </span>
        </div>
      </ControlGroup>
      <ControlGroup title="Show on" description="Hide this section on specific screen sizes.">
        {devices.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center gap-3">
            <Icon className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <ToggleField
                label={label}
                checked={section.visibility[key]}
                onChange={(on) => patch({ visibility: { ...section.visibility, [key]: on } })}
              />
            </div>
          </div>
        ))}
      </ControlGroup>
      <ControlGroup title="Actions">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => builder.duplicate(section.id)}>
            <CopyIcon className="size-4" />
            Duplicate
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex-1 text-destructive" onClick={() => builder.remove(section.id)}>
            <Trash2Icon className="size-4" />
            Delete
          </Button>
        </div>
      </ControlGroup>
    </div>
  )
}

const TABS = ["Content", "Design", "Settings"] as const

export function Inspector({ builder }: { builder: Builder }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Content")
  const section = builder.selected

  if (!section) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-muted">
          <MousePointerClickIcon className="size-5 text-muted-foreground" />
        </span>
        <p className="text-sm font-medium">Select a section</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Click a section on the canvas to change its content, colors, spacing, and visibility.
        </p>
      </div>
    )
  }

  const def = BLOCK_MAP[section.type]
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border px-4 pb-0 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{section.label || def.label}</p>
            <p className="truncate text-xs text-muted-foreground">{def.description}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => builder.select(null)}>
            Done
          </Button>
        </div>
        <div role="tablist" aria-label="Section settings" className="flex gap-4">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "-mb-px border-b-2 border-transparent pb-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                tab === t && "border-primary text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" className="flex-1 overflow-y-auto px-4">
        {tab === "Content" && <ContentTab key={section.id} section={section} builder={builder} />}
        {tab === "Design" && <DesignTab section={section} builder={builder} />}
        {tab === "Settings" && <SettingsTab section={section} builder={builder} />}
      </div>
    </div>
  )
}
