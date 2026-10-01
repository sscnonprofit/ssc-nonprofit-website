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
import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DragHandle, SortableItem } from "@/components/admin/visual-editor/sortable-item"
import { ObjectFields } from "@/components/admin/visual-editor/object-fields"
import { createEmptyArrayItem, getItemSummary } from "@/lib/cms/field-utils"
import { cn } from "@/lib/utils"

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
}: {
  label: string
  items: unknown[]
  onChange: (next: unknown[]) => void
  depth: number
}) {
  const [rows, setRows] = useState<Row[]>(() => items.map((value) => ({ id: makeId(), value })))
  const [openId, setOpenId] = useState<string | null>(rows[0]?.id ?? null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const dndId = useId()

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

  function addItem() {
    const newRow: Row = { id: makeId(), value: createEmptyArrayItem(items) }
    commit([...rows, newRow])
    setOpenId(newRow.id)
  }

  function removeItem(id: string) {
    commit(rows.filter((r) => r.id !== id))
  }

  function updateItem(id: string, value: unknown) {
    commit(rows.map((r) => (r.id === id ? { ...r, value } : r)))
  }

  const isObjectArray = typeof rows[0]?.value === "object" && rows[0]?.value !== null && !Array.isArray(rows[0]?.value)

  return (
    <div className={cn("rounded-lg border border-border p-4", depth > 0 ? "bg-background" : "bg-muted/30")}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {label} <span className="font-normal text-muted-foreground">({rows.length})</span>
        </p>
        <Button type="button" size="sm" variant="outline" onClick={addItem}>
          <PlusIcon className="size-3.5" />
          Add
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border py-4 text-center text-sm text-muted-foreground">
          No items yet. Click Add to create one.
        </p>
      ) : (
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {rows.map((row, index) =>
                isObjectArray ? (
                  <ObjectRow
                    key={row.id}
                    row={row}
                    index={index}
                    isOpen={openId === row.id}
                    onToggle={() => setOpenId((current) => (current === row.id ? null : row.id))}
                    onRemove={() => removeItem(row.id)}
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
    </div>
  )
}

function PrimitiveRow({ row, onRemove, onChange }: { row: Row; onRemove: () => void; onChange: (value: unknown) => void }) {
  return (
    <SortableItem id={row.id}>
      {({ dragHandleProps }) => (
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-background p-1.5">
          <DragHandle {...dragHandleProps} />
          <Input
            value={typeof row.value === "string" ? row.value : String(row.value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0"
          />
          <Button type="button" size="icon-sm" variant="ghost" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
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
  onChange,
}: {
  row: Row
  index: number
  isOpen: boolean
  onToggle: () => void
  onRemove: () => void
  onChange: (value: unknown) => void
}) {
  return (
    <SortableItem id={row.id}>
      {({ dragHandleProps }) => (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
          <div className="rounded-md border border-border bg-background">
            <div className="flex items-center gap-1.5 p-1.5">
              <DragHandle {...dragHandleProps} />
              <CollapsibleTrigger
                render={
                  <button type="button" className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60" />
                }
              >
                <ChevronDownIcon className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                <span className="truncate font-medium text-foreground">{getItemSummary(row.value, `Item ${index + 1}`)}</span>
              </CollapsibleTrigger>
              <Button type="button" size="icon-sm" variant="ghost" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
            <CollapsibleContent>
              <div className="border-t border-border p-3">
                <ObjectFields data={row.value as Record<string, unknown>} onChange={onChange} depth={1} />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </SortableItem>
  )
}
