"use client"

import type { CSSProperties } from "react"
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { EditProvider } from "@/lib/builder/editable"
import { BLOCK_MAP } from "@/lib/builder/registry"
import { SectionContent, SectionShell } from "@/lib/builder/render-page"
import type { Section } from "@/lib/builder/schema"
import { cn } from "@/lib/utils"

import type { Builder } from "./use-builder"

export type Device = "desktop" | "tablet" | "mobile"
export const DEVICE_WIDTH: Record<Device, number | null> = { desktop: null, tablet: 834, mobile: 390 }

function InsertLine({ onInsert, index }: { onInsert: (i: number) => void; index: number }) {
  return (
    <div className="group/insert relative z-20 h-0">
      <button
        type="button"
        onClick={() => onInsert(index)}
        className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground opacity-0 shadow-md transition-opacity focus-visible:opacity-100 group-hover/insert:opacity-100 [.group\/section:hover_&]:opacity-100"
      >
        <PlusIcon className="size-3.5" />
        Add section
      </button>
    </div>
  )
}

function ToolbarButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn("flex size-7 items-center justify-center rounded hover:bg-white/15 disabled:opacity-40", danger && "hover:bg-red-500/80")}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  )
}

function CanvasSection({ section, index, total, builder, onInsert }: { section: Section; index: number; total: number; builder: Builder; onInsert: (i: number) => void }) {
  const selected = builder.selectedId === section.id
  const def = BLOCK_MAP[section.type]
  return (
    <div
      className={cn(
        "group/section relative outline-2 -outline-offset-2 outline-transparent transition-[outline-color]",
        selected ? "outline-primary" : "hover:outline-primary/40",
      )}
      onClickCapture={(e) => {
        const target = e.target as HTMLElement
        if (target.closest("a")) e.preventDefault()
        if (!selected) builder.select(section.id)
      }}
    >
      {index === 0 && <InsertLine index={0} onInsert={onInsert} />}
      <div
        className={cn(
          "absolute right-2 top-2 z-30 flex items-center gap-0.5 rounded-md bg-primary p-0.5 text-primary-foreground shadow-lg",
          selected ? "flex" : "hidden group-hover/section:flex",
        )}
      >
        <span className="px-2 text-[11px] font-semibold">{section.label || def.label}</span>
        <ToolbarButton label="Move up" disabled={index === 0} onClick={() => builder.move(section.id, -1)}>
          <ArrowUpIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Move down" disabled={index === total - 1} onClick={() => builder.move(section.id, 1)}>
          <ArrowDownIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Duplicate" onClick={() => builder.duplicate(section.id)}>
          <CopyIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Delete" danger onClick={() => builder.remove(section.id)}>
          <Trash2Icon className="size-3.5" />
        </ToolbarButton>
      </div>
      <EditProvider onText={(path, value) => builder.setText(section.id, path, value)}>
        <SectionShell section={section}>
          <SectionContent section={section} />
        </SectionShell>
      </EditProvider>
      <InsertLine index={index + 1} onInsert={onInsert} />
    </div>
  )
}

export function Canvas({
  builder,
  device,
  themeVars,
  onInsert,
}: {
  builder: Builder
  device: Device
  themeVars: Record<string, string>
  onInsert: (index: number) => void
}) {
  const width = DEVICE_WIDTH[device]
  const { sections } = builder.doc
  return (
    <div className="min-h-full p-6" onClick={(e) => e.target === e.currentTarget && builder.select(null)}>
      <div
        className="mx-auto overflow-hidden rounded-xl border border-border shadow-xl transition-[max-width] duration-300"
        style={{ maxWidth: width ?? "100%" }}
      >
        <div
          className="@container min-h-[60vh] bg-background text-foreground [color-scheme:light]"
          style={
            {
              ...themeVars,
              fontFamily: "var(--ssc-font-body)",
              fontSize: "var(--ssc-base-size)",
              lineHeight: "var(--ssc-line-height)",
            } as CSSProperties
          }
        >
          {sections.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-center">
              <p className="text-2xl font-semibold" style={{ fontFamily: "var(--ssc-font-heading)" }}>
                Start building your page
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">Add a hero, text, gallery, FAQ, contact form, and more. Every section follows your site theme.</p>
              <button
                type="button"
                onClick={() => onInsert(0)}
                className="inline-flex items-center gap-2 rounded-[var(--ssc-btn-radius,0.5rem)] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <PlusIcon className="size-4" />
                Add your first section
              </button>
            </div>
          ) : (
            sections.map((section, index) => (
              <CanvasSection key={section.id} section={section} index={index} total={sections.length} builder={builder} onInsert={onInsert} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
