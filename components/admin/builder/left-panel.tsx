"use client"

import { useState } from "react"
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlignLeftIcon,
  BarChart3Icon,
  EyeOffIcon,
  FileTextIcon,
  GalleryHorizontalIcon,
  GripVerticalIcon,
  HelpCircleIcon,
  ImageIcon,
  LayersIcon,
  LayoutGridIcon,
  type LucideIcon,
  MailIcon,
  MegaphoneIcon,
  MoveVerticalIcon,
  PanelsTopLeftIcon,
  PlayCircleIcon,
  PlusIcon,
  QuoteIcon,
  SearchIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { ToggleField } from "@/components/admin/design/controls"
import { ImageField } from "@/components/admin/image-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BLOCKS, BLOCK_CATEGORIES, BLOCK_MAP } from "@/lib/builder/registry"
import type { Section } from "@/lib/builder/schema"
import { cn } from "@/lib/utils"

import type { Builder } from "./use-builder"

export const BLOCK_ICONS: Record<string, LucideIcon> = {
  hero: PanelsTopLeftIcon,
  richText: AlignLeftIcon,
  imageText: ImageIcon,
  features: LayoutGridIcon,
  stats: BarChart3Icon,
  cta: MegaphoneIcon,
  gallery: GalleryHorizontalIcon,
  testimonials: QuoteIcon,
  team: UsersIcon,
  faq: HelpCircleIcon,
  video: PlayCircleIcon,
  contact: MailIcon,
  spacer: MoveVerticalIcon,
}

export type LeftTab = "add" | "layers" | "page"

function AddPanel({ builder, insertAt, clearInsert }: { builder: Builder; insertAt: number | null; clearInsert: () => void }) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const matches = BLOCKS.filter((b) => !q || `${b.label} ${b.description} ${b.category}`.toLowerCase().includes(q))
  const selectedIndex = builder.doc.sections.findIndex((s) => s.id === builder.selectedId)
  const target = insertAt ?? (selectedIndex >= 0 ? selectedIndex + 1 : builder.doc.sections.length)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sections" className="h-9 pl-8" aria-label="Search sections" />
      </div>
      {insertAt !== null && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
          Inserting at position {insertAt + 1}
          <button type="button" onClick={clearInsert} aria-label="Cancel insert position">
            <XIcon className="size-3.5" />
          </button>
        </div>
      )}
      {BLOCK_CATEGORIES.map((category) => {
        const blocks = matches.filter((b) => b.category === category)
        if (!blocks.length) return null
        return (
          <div key={category} className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{category}</h3>
            <div className="grid grid-cols-2 gap-2">
              {blocks.map((block) => {
                const Icon = BLOCK_ICONS[block.type] ?? FileTextIcon
                return (
                  <button
                    key={block.type}
                    type="button"
                    title={block.description}
                    onClick={() => {
                      builder.insert(block.type, target)
                      clearInsert()
                    }}
                    className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <Icon className="size-4 text-muted-foreground group-hover:text-primary" />
                    <span className="text-xs font-medium leading-tight">{block.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {!matches.length && <p className="py-6 text-center text-sm text-muted-foreground">No sections match.</p>}
    </div>
  )
}

function LayerRow({ section, builder }: { section: Section; builder: Builder }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const def = BLOCK_MAP[section.type]
  const Icon = BLOCK_ICONS[section.type] ?? FileTextIcon
  const hidden = !section.visibility.desktop || !section.visibility.tablet || !section.visibility.mobile
  const selected = builder.selectedId === section.id
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1 rounded-md border border-transparent bg-card",
        selected && "border-primary bg-primary/5",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <button type="button" className="cursor-grab touch-none p-2 text-muted-foreground active:cursor-grabbing" aria-label={`Reorder ${section.label || def.label}`} {...attributes} {...listeners}>
        <GripVerticalIcon className="size-3.5" />
      </button>
      <button type="button" onClick={() => builder.select(section.id)} className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left text-sm">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{section.label || def.label}</span>
        {hidden && <EyeOffIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" aria-label="Hidden on some devices" />}
      </button>
    </li>
  )
}

function LayersPanel({ builder, onAdd }: { builder: Builder; onAdd: () => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) builder.reorder(String(active.id), String(over.id))
  }
  if (!builder.doc.sections.length) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <LayersIcon className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">This page has no sections yet.</p>
        <button type="button" onClick={onAdd} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Add a section
        </button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="px-1 text-xs text-muted-foreground">Drag to reorder. Top of the list is the top of the page.</p>
      <DndContext id="builder-layers" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={builder.doc.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-1">
            {builder.doc.sections.map((section) => (
              <LayerRow key={section.id} section={section} builder={builder} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function Counter({ value, ideal }: { value: string; ideal: number }) {
  return (
    <span className={cn("font-mono text-[10px]", value.length > ideal ? "text-destructive" : "text-muted-foreground")}>
      {value.length}/{ideal}
    </span>
  )
}

function PagePanel({ builder, slug }: { builder: Builder; slug: string }) {
  const { doc } = builder
  const seo = doc.seo
  const setSeo = (patch: Partial<typeof seo>) => builder.setMeta({ seo: { ...seo, ...patch } })
  const shownTitle = seo.title || doc.title
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="page-title" className="text-xs">
          Page name
        </Label>
        <Input id="page-title" value={doc.title} maxLength={120} onChange={(e) => builder.setMeta({ title: e.target.value })} />
        <span className="font-mono text-[11px] text-muted-foreground">/{slug}</span>
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-5">
        <h3 className="text-sm font-semibold">Search & sharing</h3>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="seo-title" className="text-xs">
              Search title
            </Label>
            <Counter value={seo.title} ideal={60} />
          </div>
          <Input id="seo-title" value={seo.title} placeholder={doc.title} maxLength={120} onChange={(e) => setSeo({ title: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="seo-desc" className="text-xs">
              Search description
            </Label>
            <Counter value={seo.description} ideal={160} />
          </div>
          <Textarea id="seo-desc" rows={3} value={seo.description} maxLength={300} placeholder="A short summary shown in search results." onChange={(e) => setSeo({ description: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3" aria-label="Search result preview">
          <span className="text-[11px] text-muted-foreground">Search preview</span>
          <span className="truncate text-sm font-medium text-primary">{shownTitle || "Untitled page"}</span>
          <span className="truncate text-[11px] text-muted-foreground">sheboygan senior community › {slug}</span>
          <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{seo.description || "Add a description so people know what this page is about."}</span>
        </div>
        <ImageField label="Share image" value={seo.image} onChange={(image) => setSeo({ image })} aspect={1200 / 630} />
        <ToggleField label="Hide from search engines" description="Keeps this page out of Google results." checked={seo.noindex} onChange={(noindex) => setSeo({ noindex })} />
      </div>
    </div>
  )
}

export function LeftPanel({
  builder,
  slug,
  tab,
  setTab,
  insertAt,
  setInsertAt,
}: {
  builder: Builder
  slug: string
  tab: LeftTab
  setTab: (tab: LeftTab) => void
  insertAt: number | null
  setInsertAt: (i: number | null) => void
}) {
  const tabs: { value: LeftTab; label: string; icon: LucideIcon }[] = [
    { value: "add", label: "Add", icon: PlusIcon },
    { value: "layers", label: "Layers", icon: LayersIcon },
    { value: "page", label: "Page", icon: FileTextIcon },
  ]
  return (
    <div className="flex h-full flex-col">
      <div role="tablist" aria-label="Builder tools" className="grid grid-cols-3 gap-1 border-b border-border p-2">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              tab === value && "bg-muted text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex-1 overflow-y-auto">
        {tab === "add" && <AddPanel builder={builder} insertAt={insertAt} clearInsert={() => setInsertAt(null)} />}
        {tab === "layers" && <LayersPanel builder={builder} onAdd={() => setTab("add")} />}
        {tab === "page" && <PagePanel builder={builder} slug={slug} />}
      </div>
    </div>
  )
}
