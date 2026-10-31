"use client"

import { useId, useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { ChevronDownIcon, ChevronsDownUpIcon, ChevronsUpDownIcon, CopyIcon, EyeOffIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DragHandle, SortableItem } from "@/components/admin/visual-editor/sortable-item"
import { ObjectFields } from "@/components/admin/visual-editor/object-fields"
import { useEditorQuery } from "@/components/admin/visual-editor/editor-context"
import {
  createEmptyArrayItem,
  getItemImage,
  getItemSubtitle,
  getItemSummary,
  isItemHidden,
  valueMatchesQuery,
} from "@/lib/cms/field-utils"
import { cn } from "@/lib/utils"

function singular(label: string) {
  const lower = label.toLowerCase()
  if (lower.endsWith("ies")) return `${lower.slice(0, -3)}y`
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1)
  return "item"
}

type Row = { id: string; value: unknown }

let rowIdCounter = 0
function makeId() {
  rowIdCounter += 1
  return `row-${rowIdCounter}-${Date.now()}`
}

export function ArrayField({
  label,
  items,
  onChange,
  depth,
  itemTemplate,
  embedded = false,
}: {
  label: string
  items: unknown[]
  onChange: (next: unknown[]) => void
  depth: number
  itemTemplate?: Record<string, unknown>
  /** Render without its own card and title, for use inside a page section that already provides both. */
  embedded?: boolean
}) {
  const [rows, setRows] = useState<Row[]>(() => items.map((value) => ({ id: makeId(), value })))
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(rows[0] ? [rows[0].id] : []))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const dndId = useId()
  const query = useEditorQuery()
  const visibleRows = rows.filter((row) => valueMatchesQuery("", row.value, query))

  function commit(next: Row[]) {
    setRows(next)
    onChange(next.map((r) => r.value))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = rows.findIndex((r) => r.id === active.id)
    const to = rows.findIndex((r) => r.id === over.id)
    if (from === -1 || to === -1) return
    commit(arrayMove(rows, from, to))
  }

  function openOnly(id: string) {
    setOpenIds(new Set([id]))
  }

  function addItem() {
    const newRow: Row = { id: makeId(), value: itemTemplate ? structuredClone(itemTemplate) : createEmptyArrayItem(items) }
    commit([...rows, newRow])
    openOnly(newRow.id)
  }

  function duplicateItem(id: string) {
    const index = rows.findIndex((r) => r.id === id)
    if (index === -1) return
    const copy: Row = { id: makeId(), value: structuredClone(rows[index].value) }
    commit([...rows.slice(0, index + 1), copy, ...rows.slice(index + 1)])
    openOnly(copy.id)
  }

  function removeItem(id: string) {
    commit(rows.filter((r) => r.id !== id))
  }

  function updateItem(id: string, value: unknown) {
    commit(rows.map((r) => (r.id === id ? { ...r, value } : r)))
  }

  function toggleItem(id: string) {
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isObjectArray = typeof rows[0]?.value === "object" && rows[0]?.value !== null && !Array.isArray(rows[0]?.value)
  const allOpen = rows.length > 0 && rows.every((r) => openIds.has(r.id))

  return (
    <div className={cn(!embedded && "rounded-xl border border-border p-4", !embedded && (depth > 0 ? "bg-background" : "bg-muted/30"))}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {embedded ? (
            <span className="font-normal text-muted-foreground">
              {rows.length} {rows.length === 1 ? "item" : "items"}
            </span>
          ) : (
            <>
              {label} <span className="font-normal text-muted-foreground">({rows.length})</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-1.5">
          {isObjectArray && rows.length > 1 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpenIds(allOpen ? new Set() : new Set(rows.map((r) => r.id)))}
            >
              {allOpen ? <ChevronsDownUpIcon className="size-3.5" /> : <ChevronsUpDownIcon className="size-3.5" />}
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            <PlusIcon className="size-3.5" />
            Add
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          No items yet. Click Add to create one.
        </p>
      ) : (
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleRows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {visibleRows.length === 0 && (
                <p className="rounded-lg border border-dashed border-border py-4 text-center text-sm text-muted-foreground">
                  No items match your search.
                </p>
              )}
              {visibleRows.map((row) =>
                isObjectArray ? (
                  <ObjectRow
                    key={row.id}
                    row={row}
                    index={rows.indexOf(row)}
                    isOpen={openIds.has(row.id)}
                    onToggle={() => toggleItem(row.id)}
                    onRemove={() => removeItem(row.id)}
                    onDuplicate={() => duplicateItem(row.id)}
                    onChange={(value) => updateItem(row.id, value)}
                  />
                ) : (
                  <PrimitiveRow
                    key={row.id}
                    row={row}
                    onRemove={() => removeItem(row.id)}
                    onChange={(value) => updateItem(row.id, value)}
                  />
                )
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {rows.length > 0 && !query && (
        <button
          type="button"
          onClick={addItem}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground"
        >
          <PlusIcon className="size-3.5" />
          Add {singular(label)}
        </button>
      )}
    </div>
  )
}

function PrimitiveRow({ row, onRemove, onChange }: { row: Row; onRemove: () => void; onChange: (value: unknown) => void }) {
  return (
    <SortableItem id={row.id}>
      {({ dragHandleProps }) => (
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 focus-within:border-ring">
          <DragHandle {...dragHandleProps} />
          <Input
            value={typeof row.value === "string" ? row.value : String(row.value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onRemove}
            aria-label="Remove item"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      )}
    </SortableItem>
  )
}

function ObjectRow({
  row,
  index,
  isOpen,
  onToggle,
  onRemove,
  onDuplicate,
  onChange,
}: {
  row: Row
  index: number
  isOpen: boolean
  onToggle: () => void
  onRemove: () => void
  onDuplicate: () => void
  onChange: (value: unknown) => void
}) {
  const summary = getItemSummary(row.value, `Item ${index + 1}`)
  const subtitle = getItemSubtitle(row.value, summary)
  const image = getItemImage(row.value)
  const hidden = isItemHidden(row.value)

  return (
    <SortableItem id={row.id}>
      {({ dragHandleProps }) => (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
          <div
            className={cn(
              "overflow-hidden rounded-lg border bg-background transition-colors",
              isOpen ? "border-primary/50 shadow-sm" : "border-border hover:border-foreground/25",
              hidden && "border-dashed"
            )}
          >
            <div className={cn("flex items-center gap-1.5 p-1.5", isOpen && "bg-muted/50")}>
              <DragHandle {...dragHandleProps} />
              <CollapsibleTrigger
                render={
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1.5 py-1 text-left hover:bg-muted/60"
                  />
                }
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="size-9 shrink-0 rounded-md border border-border bg-muted object-cover" />
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn("truncate text-sm font-medium text-foreground", hidden && "text-muted-foreground")}>{summary}</span>
                  {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
                </span>
                {hidden && (
                  <Badge variant="outline" className="shrink-0 gap-1">
                    <EyeOffIcon className="size-3" />
                    Hidden
                  </Badge>
                )}
                <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={onDuplicate}
                aria-label="Duplicate item"
                title="Duplicate"
                className="text-muted-foreground"
              >
                <CopyIcon className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={onRemove}
                aria-label="Remove item"
                title="Remove"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
            <CollapsibleContent>
              <div className="border-t border-border p-4">
                <ObjectFields data={row.value as Record<string, unknown>} onChange={onChange} depth={1} />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </SortableItem>
  )
}
