"use client"

import type { ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVerticalIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function SortableItem({
  id,
  children,
  dragHandleClassName,
}: {
  id: string
  children: (props: { dragHandleProps: { ref: (node: HTMLElement | null) => void } & Record<string, unknown> }) => ReactNode
  dragHandleClassName?: string
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-10 opacity-90")}
    >
      {children({
        dragHandleProps: { ref: setActivatorNodeRef, ...attributes, ...listeners, className: dragHandleClassName },
      })}
    </div>
  )
}

export function DragHandle(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing",
        props.className
      )}
      aria-label="Drag to reorder"
      {...props}
    >
      <GripVerticalIcon className="size-4" />
    </button>
  )
}
