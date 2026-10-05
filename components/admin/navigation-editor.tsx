"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ChevronUp, GripVertical, Plus, Save, Trash2 } from "lucide-react"

import { publishNavigationAction, saveNavigationDraftAction, type FooterGroup, type NavItem } from "@/app/admin/nav-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const emptyChild = (): NavItem["children"] extends (infer T)[] ? T : never => ({ label: "New link", href: "/" }) as never

export function NavigationEditor({ initialNav, initialFooter, isAdmin }: { initialNav: NavItem[]; initialFooter: FooterGroup[]; isAdmin: boolean }) {
  const [nav, setNav] = useState<NavItem[]>(initialNav)
  const [footer, setFooter] = useState<FooterGroup[]>(initialFooter)
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  const updateNav = (index: number, patch: Partial<NavItem>) => setNav((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item))
  const moveNav = (index: number, direction: -1 | 1) => setNav((items) => { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next })
  const removeNav = (index: number) => setNav((items) => items.filter((_, i) => i !== index))
  const addNav = () => setNav((items) => [...items, { label: "New menu item", href: "/" }])

  const save = (publish = false) => startTransition(async () => {
    setMessage("")
    const saved = await saveNavigationDraftAction({ nav, footer })
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
        <div><h1 className="text-2xl font-semibold tracking-tight">Navigation</h1><p className="mt-1 text-sm text-muted-foreground">Manage the header menu and footer links used across the public site.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => save()} disabled={isPending}><Save className="size-4" /> Save draft</Button>{isAdmin && <Button onClick={() => save(true)} disabled={isPending}>Publish</Button>}</div>
      </div>
      {message && <p role="status" className="rounded-md border border-border bg-card px-4 py-3 text-sm">{message}</p>}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Header menu</h2><p className="text-sm text-muted-foreground">Top-level items can contain one level of dropdown links.</p></div><Button size="sm" variant="outline" onClick={addNav}><Plus className="size-4" /> Add item</Button></div>
        <div className="space-y-3">
          {nav.map((item, index) => <div key={`${item.label}-${index}`} className="rounded-lg border border-border p-4">
            <div className="flex items-start gap-3"><GripVertical className="mt-2 size-4 text-muted-foreground" aria-hidden="true" /><div className="grid flex-1 gap-3 sm:grid-cols-2"><div><Label>Label</Label><Input value={item.label} onChange={(e) => updateNav(index, { label: e.target.value })} /></div>{item.children ? <div className="flex items-end gap-1"><Button size="icon" variant="ghost" className="size-11 sm:size-9" onClick={() => moveNav(index, -1)} aria-label="Move item up"><ChevronUp className="size-4" /></Button><Button size="icon" variant="ghost" className="size-11 sm:size-9" onClick={() => moveNav(index, 1)} aria-label="Move item down"><ChevronDown className="size-4" /></Button><Button size="icon" variant="ghost" className="size-11 text-destructive sm:size-9" onClick={() => removeNav(index)} aria-label="Remove item"><Trash2 className="size-4" /></Button></div> : <div><Label>Link</Label><Input value={item.href ?? ""} onChange={(e) => updateNav(index, { href: e.target.value })} /></div>}</div></div>
            {item.children ? <div className="mt-4 space-y-2 border-l-2 border-border pl-5">{item.children.map((child, childIndex) => <div key={`${child.label}-${childIndex}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><Input aria-label="Dropdown label" value={child.label} onChange={(e) => updateNav(index, { children: item.children?.map((c, i) => i === childIndex ? { ...c, label: e.target.value } : c) })} /><Input aria-label="Dropdown link" value={child.href} onChange={(e) => updateNav(index, { children: item.children?.map((c, i) => i === childIndex ? { ...c, href: e.target.value } : c) })} /><Button size="icon" variant="ghost" className="size-11 sm:size-9" onClick={() => updateNav(index, { children: item.children?.filter((_, i) => i !== childIndex) })} aria-label="Remove dropdown link"><Trash2 className="size-4" /></Button></div>)}<Button size="sm" variant="ghost" onClick={() => updateNav(index, { children: [...(item.children ?? []), emptyChild()] })}><Plus className="size-4" /> Add dropdown link</Button></div> : <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => updateNav(index, { href: undefined, children: [emptyChild()] })}><ChevronDown className="size-4" /> Add dropdown</Button></div>}
          </div>)}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">Footer link groups</h2><p className="mt-1 text-sm text-muted-foreground">Footer editing is available in the same draft and publish workflow.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{footer.map((group, index) => <div key={`${group.heading}-${index}`} className="rounded-lg border border-border p-4"><Label>Group heading</Label><Input value={group.heading} onChange={(e) => setFooter((items) => items.map((g, i) => i === index ? { ...g, heading: e.target.value } : g))} /><div className="mt-3 space-y-2">{group.links.map((link, linkIndex) => <div key={`${link.label}-${linkIndex}`} className="grid grid-cols-2 gap-2"><Input aria-label="Footer label" value={link.label} onChange={(e) => setFooter((items) => items.map((g, i) => i === index ? { ...g, links: g.links.map((l, j) => j === linkIndex ? { ...l, label: e.target.value } : l) } : g))} /><Input aria-label="Footer link" value={link.href} onChange={(e) => setFooter((items) => items.map((g, i) => i === index ? { ...g, links: g.links.map((l, j) => j === linkIndex ? { ...l, href: e.target.value } : l) } : g))} /></div>)}</div></div>)}</div></section>
    </div>
  )
}
