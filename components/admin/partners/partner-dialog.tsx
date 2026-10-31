"use client"

import { useState } from "react"
import { ImagesIcon } from "lucide-react"
import { MediaGrid } from "@/components/admin/media/media-grid"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { safePartnerUrl, validatePartnerSection, type Partner } from "@/lib/cms/partners"

export function PartnerDialog({ partner, isNew, onClose, onSave }: {
  partner: Partner; isNew: boolean; onClose: () => void; onSave: (partner: Partner) => void
}) {
  const [item, setItem] = useState(partner)
  const [error, setError] = useState("")
  const [libraryOpen, setLibraryOpen] = useState(false)
  const update = (patch: Partial<Partner>) => { setItem((current) => ({ ...current, ...patch })); setError("") }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const validated = validatePartnerSection({ eyebrow: "", title: "Partners", intro: "", enabled: true, partners: [item] })
      onSave(validated.partners[0])
    } catch (err) { setError(err instanceof Error ? err.message : "Check the partner details.") }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add partner" : "Edit partner"}</DialogTitle>
          <DialogDescription>Changes stay in your editor until you save a draft or publish.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="partner-name">Organization name</FieldLabel>
              <Input id="partner-name" value={item.name} onChange={(e) => update({ name: e.target.value })} maxLength={160} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="partner-website">Website URL</FieldLabel>
              <Input id="partner-website" type="url" placeholder="https://organization.org" value={item.href} onChange={(e) => update({ href: e.target.value })} maxLength={2000} />
              <FieldDescription>Optional. Links open in a new tab on the public site.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="partner-logo">Logo image</FieldLabel>
              {safePartnerUrl(item.logo, true) && <div className="rounded-lg border border-border bg-muted p-5"><img src={item.logo} alt={item.alt || item.name || "Logo preview"} className="mx-auto h-24 max-w-full object-contain" /></div>}
              <Input id="partner-logo" value={item.logo} onChange={(e) => update({ logo: e.target.value })} placeholder="/images/logo.png or https://…" maxLength={2000} required />
              <Button type="button" variant="outline" onClick={() => setLibraryOpen(!libraryOpen)} aria-expanded={libraryOpen}>
                <ImagesIcon data-icon="inline-start" />{libraryOpen ? "Close media library" : "Upload or choose a logo"}
              </Button>
              <FieldDescription>Use the media library to preserve the original logo proportions and transparency.</FieldDescription>
              {libraryOpen && <MediaGrid selectedUrl={item.logo} onPick={(logo) => { update({ logo }); setLibraryOpen(false) }} />}
            </Field>
            <Field>
              <FieldLabel htmlFor="partner-alt">Logo alternative text</FieldLabel>
              <Input id="partner-alt" value={item.alt} onChange={(e) => update({ alt: e.target.value })} placeholder={item.name || "Organization name"} maxLength={300} />
              <FieldDescription>Read by screen readers. Defaults to the organization name.</FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <input id="partner-visible" type="checkbox" checked={item.visible} onChange={(e) => update({ visible: e.target.checked })} className="size-4 accent-primary" />
              <FieldLabel htmlFor="partner-visible">Show this partner on the website</FieldLabel>
            </Field>
          </FieldGroup>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isNew ? "Add to list" : "Apply changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
