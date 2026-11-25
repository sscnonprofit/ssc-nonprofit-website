"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDownIcon, ArrowUpIcon, CircleSlashIcon, ExternalLinkIcon, EyeIcon, EyeOffIcon, ImagesIcon, Loader2Icon, PencilIcon, PlusIcon, SaveIcon, StarIcon, Trash2Icon, UtensilsIcon } from "lucide-react"
import { toast } from "sonner"
import { updateCafeMenuAction } from "@/app/admin/cafe-menu-actions"
import { MenuItemDialog } from "@/components/admin/cafe-menu/menu-item-dialog"
import { MediaGrid } from "@/components/admin/media/media-grid"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  CAFE_MENU_PATH, LIMITS, formatPrice, menusEqual, newMenuItem, newMenuSection, publicSections, safeImageUrl,
  type CafeMenu, type CafeMenuItem, type CafeMenuSection,
} from "@/lib/cafe/menu"

type Confirm = { kind: "publish" } | { kind: "discard" } | { kind: "section"; section: CafeMenuSection } | { kind: "item"; sectionId: string; item: CafeMenuItem }

function swap<T>(list: T[], index: number, direction: -1 | 1) {
  const target = index + direction
  if (index < 0 || target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export function CafeMenuEditor({ initialMenu, initialLive, initialVersion, canEdit, canPublish }: {
  initialMenu: CafeMenu; initialLive: CafeMenu; initialVersion: string | null; canEdit: boolean; canPublish: boolean
}) {
  const router = useRouter()
  const [menu, setMenu] = useState(initialMenu)
  const [saved, setSaved] = useState(initialMenu)
  const [live, setLive] = useState(initialLive)
  const [version, setVersion] = useState(initialVersion)
  const [editing, setEditing] = useState<{ sectionId: string; item: CafeMenuItem } | null>(null)
  const [confirmation, setConfirmation] = useState<Confirm | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const dirty = !menusEqual(menu, saved)
  const hasDraft = !menusEqual(saved, live)
  const itemCount = menu.sections.reduce((n, s) => n + s.items.length, 0)
  const shownCount = publicSections(menu).reduce((n, s) => n + s.items.length, 0)

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = "" }
    const confirmNavigation = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
      const link = event.target instanceof Element ? event.target.closest("a") : null
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return
      const destination = new URL(link.href, window.location.href)
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return
      if (!window.confirm("Leave without saving your menu changes?")) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener("beforeunload", warn)
    document.addEventListener("click", confirmNavigation, true)
    return () => {
      window.removeEventListener("beforeunload", warn)
      document.removeEventListener("click", confirmNavigation, true)
    }
  }, [dirty])

  function save(mode: "draft" | "publish" | "discard") {
    setError("")
    startTransition(async () => {
      try {
        const result = await updateCafeMenuAction(menu, mode, version)
        if (!result.ok) { setError(result.error); return }
        setVersion(result.version)
        setMenu(result.menu)
        setSaved(result.menu)
        setLive(result.live)
        toast.success(mode === "publish" ? "Café menu published" : mode === "discard" ? "Menu changes discarded" : "Menu draft saved")
        router.refresh()
      } catch { setError("Could not reach the server. Your changes are still here; please try again.") }
      finally { setConfirmation(null) }
    })
  }

  const patch = (p: Partial<CafeMenu>) => setMenu((m) => ({ ...m, ...p }))
  const patchSection = (id: string, p: Partial<CafeMenuSection> | ((s: CafeMenuSection) => Partial<CafeMenuSection>)) =>
    setMenu((m) => ({ ...m, sections: m.sections.map((s) => s.id === id ? { ...s, ...(typeof p === "function" ? p(s) : p) } : s) }))
  const patchItem = (sectionId: string, itemId: string, p: Partial<CafeMenuItem>) =>
    patchSection(sectionId, (s) => ({ items: s.items.map((i) => i.id === itemId ? { ...i, ...p } : i) }))
  const addSection = () => setMenu((m) => ({ ...m, sections: [...m.sections, { ...newMenuSection(), name: `New section ${m.sections.length + 1}` }] }))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><UtensilsIcon className="size-4" />Café</div>
          <Link href={CAFE_MENU_PATH} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}><ExternalLinkIcon data-icon="inline-start" />View live menu</Link>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight">Café menu</h1>
            <p className="max-w-xl text-pretty text-sm leading-6 text-muted-foreground">Manage what the café serves and what it costs. Organize items into sections, mark specials and dietary needs, and hide items that aren&apos;t available.</p>
          </div>
          <Badge variant={dirty || hasDraft ? "secondary" : "outline"}>{dirty ? "Unsaved changes" : hasDraft ? "Unpublished draft" : "Up to date"}</Badge>
        </div>
        {canEdit && <div className="flex flex-wrap items-center gap-2">
          <Button disabled={pending || menu.sections.length >= LIMITS.sections} onClick={addSection}><PlusIcon data-icon="inline-start" />Add section</Button>
          <Button variant="outline" disabled={pending || !dirty} onClick={() => save("draft")}>{pending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}Save draft</Button>
          {canPublish && <Button variant="secondary" disabled={pending || (!dirty && !hasDraft)} onClick={() => setConfirmation({ kind: "publish" })}>Publish menu</Button>}
          <Button variant="ghost" disabled={pending || (!dirty && !hasDraft)} onClick={() => setConfirmation({ kind: "discard" })}>Discard changes</Button>
        </div>}
      </header>
      {error && <Alert variant="destructive"><AlertTitle>Changes were not saved</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {!canEdit && <Alert><AlertDescription>You have read-only access. An editor can save drafts and an administrator can publish them.</AlertDescription></Alert>}
      {canEdit && !canPublish && <p className="text-sm text-muted-foreground">Save your changes as a draft. An administrator will review and publish them.</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {menu.sections.length === 0 && <Alert><UtensilsIcon /><AlertTitle>Your menu is empty</AlertTitle><AlertDescription>Add a section such as &ldquo;Coffee &amp; Drinks&rdquo; or &ldquo;Sandwiches&rdquo;, then add items to it.</AlertDescription></Alert>}
          {menu.sections.map((section, sectionIndex) => (
            <Card key={section.id} className={section.visible ? undefined : "opacity-75"}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">{section.name || "Untitled section"}{!section.visible && <Badge variant="secondary">Hidden</Badge>}</CardTitle>
                <CardDescription>{section.items.length} item{section.items.length === 1 ? "" : "s"}</CardDescription>
                {canEdit && <CardAction className="flex flex-wrap gap-1">
                  <Button size="icon" variant="ghost" aria-label={`Move ${section.name} up`} disabled={pending || sectionIndex === 0} onClick={() => setMenu((m) => ({ ...m, sections: swap(m.sections, sectionIndex, -1) }))}><ArrowUpIcon /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Move ${section.name} down`} disabled={pending || sectionIndex === menu.sections.length - 1} onClick={() => setMenu((m) => ({ ...m, sections: swap(m.sections, sectionIndex, 1) }))}><ArrowDownIcon /></Button>
                  <Button size="icon" variant="ghost" aria-label={`${section.visible ? "Hide" : "Show"} ${section.name}`} disabled={pending} onClick={() => patchSection(section.id, { visible: !section.visible })}>{section.visible ? <EyeIcon /> : <EyeOffIcon />}</Button>
                  <Button size="icon" variant="ghost" aria-label={`Remove ${section.name}`} disabled={pending} onClick={() => setConfirmation({ kind: "section", section })}><Trash2Icon /></Button>
                </CardAction>}
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <fieldset disabled={!canEdit || pending} className="grid gap-4 sm:grid-cols-2">
                  <Field><FieldLabel htmlFor={`section-name-${section.id}`}>Section name</FieldLabel><Input id={`section-name-${section.id}`} maxLength={80} required value={section.name} onChange={(e) => patchSection(section.id, { name: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor={`section-desc-${section.id}`}>Short description</FieldLabel><Input id={`section-desc-${section.id}`} maxLength={300} placeholder="Optional" value={section.description} onChange={(e) => patchSection(section.id, { description: e.target.value })} /></Field>
                </fieldset>
                {section.items.length > 0 && <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {section.items.map((item, itemIndex) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${item.visible ? "" : "opacity-60"}`}>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <p className="text-sm font-semibold">{item.name}</p>
                          {item.price && <p className="text-sm font-semibold tabular-nums text-primary">{formatPrice(item.price)}</p>}
                          {item.priceNote && <p className="text-xs text-muted-foreground">{item.priceNote}</p>}
                        </div>
                        {item.description && <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
                        <div className="flex flex-wrap gap-1.5">
                          {item.featured && <Badge><StarIcon data-icon="inline-start" />Special</Badge>}
                          {!item.available && <Badge variant="destructive"><CircleSlashIcon data-icon="inline-start" />Not available</Badge>}
                          {!item.visible && <Badge variant="secondary">Hidden</Badge>}
                          {item.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                        </div>
                      </div>
                      {canEdit && <div className="flex flex-wrap items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label={`Move ${item.name} up`} disabled={pending || itemIndex === 0} onClick={() => patchSection(section.id, (s) => ({ items: swap(s.items, itemIndex, -1) }))}><ArrowUpIcon /></Button>
                        <Button size="icon" variant="ghost" aria-label={`Move ${item.name} down`} disabled={pending || itemIndex === section.items.length - 1} onClick={() => patchSection(section.id, (s) => ({ items: swap(s.items, itemIndex, 1) }))}><ArrowDownIcon /></Button>
                        <Button size="sm" variant="ghost" aria-pressed={!item.available} disabled={pending} onClick={() => patchItem(section.id, item.id, { available: !item.available })}>{item.available ? "Mark unavailable" : "Mark available"}</Button>
                        <Button size="icon" variant="ghost" aria-label={`${item.visible ? "Hide" : "Show"} ${item.name}`} disabled={pending} onClick={() => patchItem(section.id, item.id, { visible: !item.visible })}>{item.visible ? <EyeIcon /> : <EyeOffIcon />}</Button>
                        <Button size="icon" variant="outline" aria-label={`Edit ${item.name}`} disabled={pending} onClick={() => setEditing({ sectionId: section.id, item })}><PencilIcon /></Button>
                        <Button size="icon" variant="ghost" aria-label={`Remove ${item.name}`} disabled={pending} onClick={() => setConfirmation({ kind: "item", sectionId: section.id, item })}><Trash2Icon /></Button>
                      </div>}
                    </li>
                  ))}
                </ul>}
                {canEdit && <Button variant="outline" className="w-fit" disabled={pending || section.items.length >= LIMITS.items} onClick={() => setEditing({ sectionId: section.id, item: newMenuItem() })}><PlusIcon data-icon="inline-start" />Add item</Button>}
              </CardContent>
            </Card>
          ))}
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Menu page settings</CardTitle><CardDescription>{itemCount} item{itemCount === 1 ? "" : "s"} · {shownCount} shown on the website</CardDescription></CardHeader>
            <CardContent>
              <fieldset disabled={!canEdit || pending}>
                <FieldGroup>
                  <Field orientation="horizontal"><input id="menu-enabled" type="checkbox" className="size-4 accent-primary" checked={menu.enabled} onChange={(e) => patch({ enabled: e.target.checked })} /><FieldLabel htmlFor="menu-enabled">Show the menu on the website</FieldLabel></Field>
                  <Field><FieldLabel htmlFor="menu-title">Page title</FieldLabel><Input id="menu-title" maxLength={120} required value={menu.title} onChange={(e) => patch({ title: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="menu-intro">Introduction</FieldLabel><Textarea id="menu-intro" maxLength={600} value={menu.intro} onChange={(e) => patch({ intro: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="menu-hours">Hours</FieldLabel><Textarea id="menu-hours" maxLength={300} placeholder={"Mon–Fri 8:00 am – 2:00 pm\nSat 9:00 am – 12:00 pm"} value={menu.hours} onChange={(e) => patch({ hours: e.target.value })} /><FieldDescription>One line per day or range.</FieldDescription></Field>
                  <Field><FieldLabel htmlFor="menu-location">Location</FieldLabel><Input id="menu-location" maxLength={160} placeholder="e.g. Main building, first floor" value={menu.location} onChange={(e) => patch({ location: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="menu-footnote">Footnote</FieldLabel><Textarea id="menu-footnote" maxLength={400} value={menu.footnote} onChange={(e) => patch({ footnote: e.target.value })} /></Field>
                  <Field>
                    <FieldLabel htmlFor="menu-hero">Header image</FieldLabel>
                    {safeImageUrl(menu.heroImage) && <img src={menu.heroImage} alt="" className="aspect-[16/7] w-full rounded-md border border-border object-cover" />}
                    <Input id="menu-hero" maxLength={2000} value={menu.heroImage} onChange={(e) => patch({ heroImage: e.target.value })} />
                    <Button type="button" variant="outline" onClick={() => setLibraryOpen((v) => !v)} aria-expanded={libraryOpen}><ImagesIcon data-icon="inline-start" />{libraryOpen ? "Close media library" : "Upload or choose an image"}</Button>
                    {libraryOpen && <MediaGrid selectedUrl={menu.heroImage} onPick={(heroImage) => { patch({ heroImage }); setLibraryOpen(false) }} />}
                  </Field>
                </FieldGroup>
              </fieldset>
            </CardContent>
          </Card>
          <Alert><SaveIcon /><AlertTitle>Drafts stay private</AlertTitle><AlertDescription>Visitors see the menu only after it is published. Hidden sections and items, and sections with no visible items, never appear on the website.</AlertDescription></Alert>
        </aside>
      </div>

      {editing && <MenuItemDialog
        item={editing.item}
        sectionName={menu.sections.find((s) => s.id === editing.sectionId)?.name || "section"}
        isNew={!menu.sections.some((s) => s.items.some((i) => i.id === editing.item.id))}
        onClose={() => setEditing(null)}
        onSave={(item) => {
          patchSection(editing.sectionId, (s) => ({ items: s.items.some((i) => i.id === item.id) ? s.items.map((i) => i.id === item.id ? item : i) : [...s.items, item] }))
          setEditing(null)
        }}
      />}
      <Dialog open={confirmation !== null} onOpenChange={(open) => { if (!open && !pending) setConfirmation(null) }}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>{confirmation?.kind === "publish" ? "Publish the café menu?" : confirmation?.kind === "discard" ? "Discard menu changes?" : confirmation?.kind === "section" ? "Remove this section?" : "Remove this item?"}</DialogTitle>
            <DialogDescription>{confirmation?.kind === "publish" ? "Visitors will see this menu and its prices on the website immediately."
              : confirmation?.kind === "discard" ? "This replaces your edits and any saved draft with the menu that is live now."
              : confirmation?.kind === "section" ? `Remove “${confirmation.section.name}” and its ${confirmation.section.items.length} item${confirmation.section.items.length === 1 ? "" : "s"}? The live menu won't change until you publish.`
              : confirmation?.kind === "item" ? `Remove “${confirmation.item.name}”? The live menu won't change until you publish.` : ""}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setConfirmation(null)}>Cancel</Button>
            <Button variant={confirmation?.kind === "publish" ? "default" : "destructive"} disabled={pending} onClick={() => {
              if (!confirmation) return
              if (confirmation.kind === "publish" || confirmation.kind === "discard") return save(confirmation.kind)
              if (confirmation.kind === "section") setMenu((m) => ({ ...m, sections: m.sections.filter((s) => s.id !== confirmation.section.id) }))
              else patchSection(confirmation.sectionId, (s) => ({ items: s.items.filter((i) => i.id !== confirmation.item.id) }))
              setConfirmation(null)
            }}>{pending ? "Saving…" : confirmation?.kind === "publish" ? "Publish menu" : confirmation?.kind === "discard" ? "Discard changes" : "Remove"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
