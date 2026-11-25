"use client"

import { useId, useState, useTransition, type ReactNode } from "react"
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { ChevronDown, ChevronUp, ListPlus, Plus, Save, Trash2, Unlink } from "lucide-react"

import { publishNavigationAction, saveNavigationDraftAction, type FooterGroup, type NavChild, type NavItem } from "@/app/admin/nav-actions"
import { DragHandle, SortableItem } from "@/components/admin/visual-editor/sortable-item"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Editor rows carry a stable id so drag-and-drop and React keys survive reordering.
// Ids are stripped before saving.
type Keyed<T> = T & { _id: string }
type EChild = Keyed<NavChild>
type EItem = Keyed<Omit<NavItem, "children"> & { children?: EChild[] }>
type EGroup = Keyed<Omit<FooterGroup, "links"> & { links: EChild[] }>

const key = () => crypto.randomUUID()
const keyed = <T extends object>(value: T): Keyed<T> => ({ ...value, _id: key() })
const strip = <T extends { _id: string }>({ _id, ...rest }: T) => { void _id; return rest }
const newLink = (): EChild => keyed({ label: "New link", href: "/" })

function move<T>(list: T[], index: number, direction: -1 | 1) {
  const target = index + direction
  return target < 0 || target >= list.length ? list : arrayMove(list, index, target)
}

/** A vertical list whose rows can be dragged by their handle (mouse, touch or keyboard). */
function SortableList<T extends { _id: string }>({ items, onReorder, children }: {
  items: T[]
  onReorder: (next: T[]) => void
  children: (item: T, index: number, handle: ReactNode) => ReactNode
}) {
  const id = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i._id === active.id)
    const to = items.findIndex((i) => i._id === over.id)
    if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to))
  }
  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <SortableItem key={item._id} id={item._id}>
              {({ dragHandleProps }) => children(item, index, <DragHandle {...dragHandleProps} className="size-11 sm:size-9" />)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function MoveButtons({ label, index, count, onMove }: { label: string; index: number; count: number; onMove: (direction: -1 | 1) => void }) {
  return (
    <>
      <Button type="button" size="icon" variant="ghost" className="size-11 sm:size-9" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move ${label} up`}><ChevronUp className="size-4" /></Button>
      <Button type="button" size="icon" variant="ghost" className="size-11 sm:size-9" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`Move ${label} down`}><ChevronDown className="size-4" /></Button>
    </>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button type="button" size="icon" variant="ghost" className="size-11 text-destructive sm:size-9" onClick={onClick} aria-label={`Remove ${label}`}><Trash2 className="size-4" /></Button>
}

/** Label + link inputs with drag/move/remove controls, used for dropdown and footer links. */
function LinkRows({ links, onChange, kind }: { links: EChild[]; onChange: (next: EChild[]) => void; kind: string }) {
  const update = (id: string, patch: Partial<NavChild>) => onChange(links.map((l) => l._id === id ? { ...l, ...patch } : l))
  return (
    <SortableList items={links} onReorder={onChange}>
      {(link, index, handle) => (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-background sm:flex-nowrap">
          {handle}
          <Input aria-label={`${kind} label`} className="min-w-0 flex-1" value={link.label} onChange={(e) => update(link._id, { label: e.target.value })} />
          <Input aria-label={`${kind} URL`} className="min-w-0 flex-1" value={link.href} onChange={(e) => update(link._id, { href: e.target.value })} />
          <div className="flex shrink-0">
            <MoveButtons label={link.label || kind} index={index} count={links.length} onMove={(d) => onChange(move(links, index, d))} />
            <RemoveButton label={link.label || kind} onClick={() => onChange(links.filter((l) => l._id !== link._id))} />
          </div>
        </div>
      )}
    </SortableList>
  )
}

export function NavigationEditor({ initialNav, initialFooter, isAdmin }: { initialNav: NavItem[]; initialFooter: FooterGroup[]; isAdmin: boolean }) {
  const [nav, setNav] = useState<EItem[]>(() => initialNav.map((item) => keyed({ ...item, children: item.children?.map(keyed) })))
  const [footer, setFooter] = useState<EGroup[]>(() => initialFooter.map((group) => keyed({ ...group, links: group.links.map(keyed) })))
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  const updateNav = (id: string, patch: Partial<EItem>) => setNav((items) => items.map((item) => item._id === id ? { ...item, ...patch } : item))
  const updateGroup = (id: string, patch: Partial<EGroup>) => setFooter((groups) => groups.map((g) => g._id === id ? { ...g, ...patch } : g))

  const save = (publish = false) => startTransition(async () => {
    setMessage("")
    const payload = {
      nav: nav.map((item) => {
        const { children, ...rest } = strip(item)
        return children ? { ...rest, children: children.map(strip) } : rest
      }),
      footer: footer.map((group) => ({ ...strip(group), links: group.links.map(strip) })),
    }
    const saved = await saveNavigationDraftAction(payload)
    if (!saved.ok) return setMessage(saved.error)
    if (publish) {
      const published = await publishNavigationAction()
      if (!published.ok) return setMessage(published.error)
    }
    setMessage(publish ? "Navigation published" : "Draft saved")
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Navigation</h1><p className="mt-1 text-sm text-muted-foreground">Manage the header menu and footer links used across the public site. Drag the handle or use the arrows to change the order.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => save()} disabled={isPending}><Save className="size-4" /> Save draft</Button>{isAdmin && <Button onClick={() => save(true)} disabled={isPending}>Publish</Button>}</div>
      </div>
      {message && <p role="status" className="rounded-md border border-border bg-card px-4 py-3 text-sm">{message}</p>}

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Header menu</h2><p className="text-sm text-muted-foreground">Top-level items are either a single link or a dropdown of links.</p></div><Button size="sm" variant="outline" onClick={() => setNav((items) => [...items, keyed({ label: "New menu item", href: "/" })])}><Plus className="size-4" /> Add item</Button></div>
        <SortableList items={nav} onReorder={setNav}>
          {(item, index, handle) => (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-2">
                <div className="pt-6">{handle}</div>
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5"><Label htmlFor={`nav-label-${item._id}`}>Label</Label><Input id={`nav-label-${item._id}`} value={item.label} onChange={(e) => updateNav(item._id, { label: e.target.value })} /></div>
                  {item.children
                    ? <p className="self-end pb-2 text-sm text-muted-foreground">Dropdown with {item.children.length} link{item.children.length === 1 ? "" : "s"}</p>
                    : <div className="flex flex-col gap-1.5"><Label htmlFor={`nav-href-${item._id}`}>Link</Label><Input id={`nav-href-${item._id}`} value={item.href ?? ""} onChange={(e) => updateNav(item._id, { href: e.target.value })} /></div>}
                </div>
                <div className="flex shrink-0 flex-col pt-6 sm:flex-row">
                  <MoveButtons label={item.label || "item"} index={index} count={nav.length} onMove={(d) => setNav((items) => move(items, index, d))} />
                  <RemoveButton label={item.label || "item"} onClick={() => setNav((items) => items.filter((i) => i._id !== item._id))} />
                </div>
              </div>
              {item.children ? (
                <div className="mt-4 flex flex-col gap-2 border-l-2 border-border pl-4 sm:ml-11">
                  <LinkRows kind="Dropdown link" links={item.children} onChange={(children) => updateNav(item._id, { children })} />
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" onClick={() => updateNav(item._id, { children: [...(item.children ?? []), newLink()] })}><Plus className="size-4" /> Add dropdown link</Button>
                    {item.children.length === 0 && <Button size="sm" variant="ghost" onClick={() => updateNav(item._id, { children: undefined, href: "/" })}><Unlink className="size-4" /> Make a single link</Button>}
                  </div>
                </div>
              ) : (
                <div className="mt-3 sm:ml-11"><Button size="sm" variant="ghost" onClick={() => updateNav(item._id, { href: undefined, children: [newLink()] })}><ListPlus className="size-4" /> Turn into dropdown</Button></div>
              )}
            </div>
          )}
        </SortableList>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Footer link groups</h2>
        <p className="mt-1 text-sm text-muted-foreground">Footer editing uses the same draft and publish workflow.</p>
        <div className="mt-4">
          <SortableList items={footer} onReorder={setFooter}>
            {(group, index, handle) => (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-end gap-2">
                  {handle}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5"><Label htmlFor={`footer-heading-${group._id}`}>Group heading</Label><Input id={`footer-heading-${group._id}`} value={group.heading} onChange={(e) => updateGroup(group._id, { heading: e.target.value })} /></div>
                  <div className="flex shrink-0"><MoveButtons label={group.heading || "group"} index={index} count={footer.length} onMove={(d) => setFooter((groups) => move(groups, index, d))} /></div>
                </div>
                <div className="mt-3 flex flex-col gap-2 border-l-2 border-border pl-4 sm:ml-11">
                  <LinkRows kind="Footer link" links={group.links} onChange={(links) => updateGroup(group._id, { links })} />
                  <Button size="sm" variant="ghost" className="w-fit" onClick={() => updateGroup(group._id, { links: [...group.links, newLink()] })}><Plus className="size-4" /> Add footer link</Button>
                </div>
              </div>
            )}
          </SortableList>
        </div>
      </section>
    </div>
  )
}
