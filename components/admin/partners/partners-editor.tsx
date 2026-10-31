"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDownIcon, ArrowUpIcon, ExternalLinkIcon, EyeIcon, EyeOffIcon, HandshakeIcon, Loader2Icon, PencilIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { updatePartnersAction } from "@/app/admin/partner-actions"
import { PartnerDialog } from "@/components/admin/partners/partner-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { partnerSectionsEqual, safePartnerUrl, type Partner, type PartnerSection } from "@/lib/cms/partners"

export function PartnersEditor({ initialSection, initialLive, initialVersion, canEdit, canPublish }: {
  initialSection: PartnerSection; initialLive: PartnerSection; initialVersion: string | null; canEdit: boolean; canPublish: boolean
}) {
  const router = useRouter()
  const [section, setSection] = useState(initialSection)
  const [saved, setSaved] = useState(initialSection)
  const [live, setLive] = useState(initialLive)
  const [version, setVersion] = useState(initialVersion)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [confirmation, setConfirmation] = useState<"publish" | "discard" | Partner | null>(null)
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const dirty = !partnerSectionsEqual(section, saved)
  const hasDraft = !partnerSectionsEqual(saved, live)
  const visible = section.partners.filter((p) => p.visible)
  const filtered = section.partners.filter((p) => `${p.name} ${p.href}`.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = "" }
    const confirmNavigation = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
      const link = event.target instanceof Element ? event.target.closest("a") : null
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return
      const destination = new URL(link.href, window.location.href)
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return
      if (!window.confirm("Leave without saving your partner changes?")) {
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
        const result = await updatePartnersAction(section, mode, version)
        if (!result.ok) { setError(result.error); return }
        setVersion(result.version)
        setSection(result.section)
        setSaved(result.section)
        setLive(result.liveSection)
        toast.success(mode === "publish" ? "Partners published to Community Outreach" : mode === "discard" ? "Partner changes discarded" : "Partner draft saved")
        router.refresh()
      } catch { setError("Could not reach the server. Your changes are still here; please try again.") }
      finally { setConfirmation(null) }
    })
  }

  function move(id: string, direction: -1 | 1) {
    setSection((current) => {
      const partners = [...current.partners]
      const index = partners.findIndex((p) => p.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= partners.length) return current
      ;[partners[index], partners[target]] = [partners[target], partners[index]]
      return { ...current, partners }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><HandshakeIcon className="size-4" />Community Outreach</div>
          <Link href="/community-outreach#partners" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}><ExternalLinkIcon data-icon="inline-start" />View live page</Link>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight">Community partners</h1>
            <p className="max-w-xl text-pretty text-sm leading-6 text-muted-foreground">Celebrate the organizations that support our community. Manage logos, links, visibility, and the order they appear.</p>
          </div>
          <Badge variant={dirty || hasDraft ? "secondary" : "outline"}>{dirty ? "Unsaved changes" : hasDraft ? "Unpublished draft" : "Up to date"}</Badge>
        </div>
        {canEdit && <div className="flex flex-wrap items-center gap-2">
          <Button disabled={pending || section.partners.length >= 100} onClick={() => setEditing({ id: crypto.randomUUID(), name: "", logo: "", href: "", alt: "", visible: true })}><PlusIcon data-icon="inline-start" />Add partner</Button>
          <Button variant="outline" disabled={pending || !dirty} onClick={() => save("draft")}>{pending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}Save draft</Button>
          {canPublish && <Button variant="secondary" disabled={pending || (!dirty && !hasDraft)} onClick={() => setConfirmation("publish")}>Publish changes</Button>}
          <Button variant="ghost" disabled={pending || (!dirty && !hasDraft)} onClick={() => setConfirmation("discard")}>Discard changes</Button>
        </div>}
      </header>
      {error && <Alert variant="destructive"><AlertTitle>Changes were not saved</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {!canEdit && <Alert><AlertDescription>You have read-only access. An editor can save drafts and an administrator can publish them.</AlertDescription></Alert>}
      {canEdit && !canPublish && <p className="text-sm text-muted-foreground">Save your changes as a draft. An administrator will review and publish them.</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Partner directory</CardTitle><CardDescription>{section.partners.length} total · {visible.length} visible · {section.partners.length - visible.length} hidden</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Input aria-label="Search partners" type="search" placeholder="Search by organization or website…" value={query} onChange={(e) => setQuery(e.target.value)} />
              {query && <p className="text-sm text-muted-foreground">Clear the search to change display order.</p>}
              {filtered.length === 0 ? <Alert><HandshakeIcon /><AlertTitle>{section.partners.length ? "No partners found" : "Your partner directory is empty"}</AlertTitle><AlertDescription>{section.partners.length ? "Try a different organization name." : "Add your first partner to feature them on Community Outreach."}</AlertDescription></Alert> : (
                <ul className="flex flex-col divide-y divide-border">
                  {filtered.map((partner) => {
                    const index = section.partners.findIndex((p) => p.id === partner.id)
                    return <li key={partner.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-border bg-muted p-2">
                          {safePartnerUrl(partner.logo, true) ? <img src={partner.logo} alt="" className="max-h-full max-w-full object-contain" loading="lazy" /> : <HandshakeIcon className="size-6 text-muted-foreground" />}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <p className="text-sm font-semibold">{partner.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{partner.href || "No website link"}</p>
                          <Badge variant={partner.visible ? "outline" : "secondary"} className="w-fit">{partner.visible ? "Visible" : "Hidden"}</Badge>
                        </div>
                        {canEdit && <div className="flex w-full flex-wrap items-center justify-end gap-1 sm:w-auto">
                          <Button size="icon" variant="ghost" aria-label={`Move ${partner.name} up`} disabled={pending || index === 0 || Boolean(query)} onClick={() => move(partner.id, -1)}><ArrowUpIcon /></Button>
                          <Button size="icon" variant="ghost" aria-label={`Move ${partner.name} down`} disabled={pending || index === section.partners.length - 1 || Boolean(query)} onClick={() => move(partner.id, 1)}><ArrowDownIcon /></Button>
                          <Button size="icon" variant="ghost" aria-label={`${partner.visible ? "Hide" : "Show"} ${partner.name}`} disabled={pending} onClick={() => setSection((s) => ({ ...s, partners: s.partners.map((p) => p.id === partner.id ? { ...p, visible: !p.visible } : p) }))}>{partner.visible ? <EyeIcon /> : <EyeOffIcon />}</Button>
                          <Button size="icon" variant="outline" aria-label={`Edit ${partner.name}`} disabled={pending} onClick={() => setEditing(partner)}><PencilIcon /></Button>
                          <Button size="icon" variant="ghost" aria-label={`Remove ${partner.name}`} disabled={pending} onClick={() => setConfirmation(partner)}><Trash2Icon /></Button>
                        </div>}
                      </div>
                    </li>
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Section settings</CardTitle><CardDescription>Customize the introduction above the partner logos.</CardDescription></CardHeader>
            <CardContent>
              <fieldset disabled={!canEdit || pending}>
                <FieldGroup>
                  <Field orientation="horizontal"><input id="partners-enabled" type="checkbox" className="size-4 accent-primary" checked={section.enabled} onChange={(e) => setSection((s) => ({ ...s, enabled: e.target.checked }))} /><FieldLabel htmlFor="partners-enabled">Show partner section on the website</FieldLabel></Field>
                  <Field><FieldLabel htmlFor="partners-eyebrow">Eyebrow</FieldLabel><Input id="partners-eyebrow" maxLength={80} value={section.eyebrow} onChange={(e) => setSection((s) => ({ ...s, eyebrow: e.target.value }))} /></Field>
                  <Field><FieldLabel htmlFor="partners-title">Heading</FieldLabel><Input id="partners-title" maxLength={180} required value={section.title} onChange={(e) => setSection((s) => ({ ...s, title: e.target.value }))} /></Field>
                  <Field><FieldLabel htmlFor="partners-intro">Introduction</FieldLabel><Textarea id="partners-intro" maxLength={1000} value={section.intro} onChange={(e) => setSection((s) => ({ ...s, intro: e.target.value }))} /></Field>
                </FieldGroup>
              </fieldset>
            </CardContent>
          </Card>
        </div>
        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Section preview</CardTitle><CardDescription>Preview of your current edits, not the live page.</CardDescription></CardHeader>
            <CardContent>
              {!section.enabled || !visible.length ? <p className="text-sm leading-6 text-muted-foreground">The partner section is hidden{!visible.length ? " because no partners are visible" : ""}.</p> : <div className="flex flex-col gap-4 text-center">
                <p className="text-sm font-medium text-primary">{section.eyebrow}</p>
                <h2 className="text-balance font-serif text-xl font-semibold">{section.title}</h2>
                <p className="text-pretty text-sm leading-6 text-muted-foreground">{section.intro}</p>
                <div className="grid grid-cols-2 items-center gap-4">{visible.map((partner) => <div key={partner.id} className="flex h-20 items-center justify-center rounded-md bg-muted p-2">{safePartnerUrl(partner.logo, true) ? <img src={partner.logo} alt={partner.alt || partner.name} className="max-h-full max-w-full object-contain" loading="lazy" /> : <span className="text-sm">{partner.name}</span>}</div>)}</div>
              </div>}
            </CardContent>
          </Card>
          <Alert><SaveIcon /><AlertTitle>Publish with confidence</AlertTitle><AlertDescription>Drafts stay private. Publishing here updates only partners and their section settings; other Pillars drafts stay untouched.</AlertDescription></Alert>
        </aside>
      </div>

      {editing && <PartnerDialog partner={editing} isNew={!section.partners.some((p) => p.id === editing.id)} onClose={() => setEditing(null)} onSave={(item) => {
        setSection((s) => ({ ...s, partners: s.partners.some((p) => p.id === item.id) ? s.partners.map((p) => p.id === item.id ? item : p) : [...s.partners, item] }))
        setEditing(null)
      }} />}
      <Dialog open={confirmation !== null} onOpenChange={(open) => { if (!open && !pending) setConfirmation(null) }}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>{confirmation === "publish" ? "Publish partner changes?" : confirmation === "discard" ? "Discard partner changes?" : "Remove this partner?"}</DialogTitle>
            <DialogDescription>{confirmation === "publish" ? "Your current partner list and section settings will appear on Community Outreach immediately. Other pillar drafts will not be published." : confirmation === "discard" ? "This replaces your current partner edits and saved partner draft with the live version. Other pillar drafts are preserved." : `Remove ${typeof confirmation === "object" ? confirmation?.name ?? "this organization" : "this organization"} from the list? The live site will not change until you publish.`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setConfirmation(null)}>Cancel</Button>
            <Button variant={confirmation === "publish" ? "default" : "destructive"} disabled={pending} onClick={() => {
              if (confirmation === "publish" || confirmation === "discard") save(confirmation)
              else if (confirmation) { setSection((s) => ({ ...s, partners: s.partners.filter((p) => p.id !== confirmation.id) })); setConfirmation(null) }
            }}>{pending ? "Saving…" : confirmation === "publish" ? "Publish partners" : confirmation === "discard" ? "Discard changes" : "Remove partner"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
