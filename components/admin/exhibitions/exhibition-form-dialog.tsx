"use client"

import { useState, useTransition } from "react"
import { CheckIcon, ImagesIcon } from "lucide-react"
import { toast } from "sonner"

import { saveExhibitionAction } from "@/app/admin/exhibition-actions"
import { ImageField } from "@/components/admin/image-field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/builder/schema"
import { EXHIBITION_STATUS_OPTIONS, type AlbumOption, type ExhibitionForm } from "@/lib/gallery/exhibition-constants"
import { cn } from "@/lib/utils"

function blankForm(): ExhibitionForm {
  return {
    title: "",
    slug: "",
    description: "",
    coverUrl: "",
    venueName: "",
    venueAddress: "",
    venuePhone: "",
    venueEmail: "",
    venueWebsite: "",
    startsAt: "",
    endsAt: "",
    publicOpeningAt: "",
    submissionDeadline: "",
    status: "draft",
    featured: false,
    submissionsEnabled: false,
    albumIds: [],
  }
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{hint}</p>}
    </div>
  )
}

function ToggleRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex min-h-11 items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="leading-snug">{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </div>
  )
}

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-border p-3 sm:p-4" aria-labelledby={id}>
      <div>
        <h3 id={id} className="text-sm font-medium">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export function ExhibitionFormDialog({
  open,
  onOpenChange,
  exhibitionId,
  initial,
  albums,
  role,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  exhibitionId: number | null
  initial: ExhibitionForm | null
  albums: AlbumOption[]
  role: string
  onSaved: () => void
}) {
  const [form, setForm] = useState<ExhibitionForm>(blankForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [pending, startTransition] = useTransition()
  const isAdmin = role === "admin"

  // Load once per opening so a background refresh never wipes unsaved edits.
  const loadKey = open ? String(exhibitionId ?? "new") : null
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  if (loadKey !== loadedKey) {
    setLoadedKey(loadKey)
    if (loadKey) {
      setForm(initial ?? blankForm())
      setSlugTouched(Boolean(initial))
    }
  }

  function patch(values: Partial<ExhibitionForm>) {
    setForm((current) => ({ ...current, ...values }))
  }

  function toggleAlbum(id: number) {
    patch({ albumIds: form.albumIds.includes(id) ? form.albumIds.filter((item) => item !== id) : [...form.albumIds, id] })
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveExhibitionAction({ ...form, id: exhibitionId ?? undefined })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(exhibitionId ? "Exhibition saved" : "Exhibition created")
      onOpenChange(false)
      onSaved()
    })
  }

  const statusHint = EXHIBITION_STATUS_OPTIONS.find((item) => item.value === form.status)?.hint
  const submissionsBlocked = form.submissionsEnabled && form.status !== "open"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:max-w-3xl">
        <DialogHeader className="shrink-0 gap-1 border-b border-border py-4 pr-14 pl-4 text-left sm:px-6 sm:py-5 sm:pr-16">
          <DialogTitle className="text-lg leading-tight text-balance">{exhibitionId ? "Edit exhibition" : "New exhibition"}</DialogTitle>
          <DialogDescription className="text-pretty">Drafts and archived exhibitions stay hidden from the Artists Gallery.</DialogDescription>
        </DialogHeader>

        <form id="exhibition-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain p-4 sm:p-6">
          <Field id="ex-title" label="Title">
            <Input
              id="ex-title"
              value={form.title}
              onChange={(e) => patch(slugTouched ? { title: e.target.value } : { title: e.target.value, slug: slugify(e.target.value) })}
              required
              maxLength={160}
              className="h-11 text-base"
            />
          </Field>

          <Field id="ex-description" label="Description" hint="Blank lines start a new paragraph.">
            <Textarea id="ex-description" value={form.description} onChange={(e) => patch({ description: e.target.value })} rows={5} maxLength={5000} className="text-base" />
          </Field>

          <ImageField label="Cover image" value={form.coverUrl} onChange={(url) => patch({ coverUrl: url || "" })} aspect={4 / 3} />

          <Section id="ex-dates" title="Dates" hint="Times are in Central Time, the same as the campus.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="ex-start" label="Exhibition opens">
                <Input id="ex-start" type="datetime-local" value={form.startsAt} onChange={(e) => patch({ startsAt: e.target.value })} className="h-11 text-base" />
              </Field>
              <Field id="ex-end" label="Exhibition closes">
                <Input id="ex-end" type="datetime-local" value={form.endsAt} min={form.startsAt || undefined} onChange={(e) => patch({ endsAt: e.target.value })} className="h-11 text-base" />
              </Field>
              <Field id="ex-reception" label="Opening reception" hint="Optional public opening event.">
                <Input id="ex-reception" type="datetime-local" value={form.publicOpeningAt} onChange={(e) => patch({ publicOpeningAt: e.target.value })} className="h-11 text-base" />
              </Field>
              <Field id="ex-deadline" label="Submission deadline" hint="The open call closes automatically after this.">
                <Input id="ex-deadline" type="datetime-local" value={form.submissionDeadline} onChange={(e) => patch({ submissionDeadline: e.target.value })} className="h-11 text-base" />
              </Field>
            </div>
          </Section>

          <Section id="ex-venue" title="Venue and contact" hint="Shown on the exhibition page.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ex-venue-name" label="Venue name">
                <Input id="ex-venue-name" value={form.venueName} onChange={(e) => patch({ venueName: e.target.value })} maxLength={160} placeholder="Senior Services of Central" className="h-11 text-base" />
              </Field>
              <Field id="ex-venue-address" label="Address">
                <Input id="ex-venue-address" value={form.venueAddress} onChange={(e) => patch({ venueAddress: e.target.value })} maxLength={300} className="h-11 text-base" />
              </Field>
              <Field id="ex-venue-phone" label="Phone">
                <Input id="ex-venue-phone" type="tel" inputMode="tel" value={form.venuePhone} onChange={(e) => patch({ venuePhone: e.target.value })} maxLength={60} autoComplete="off" className="h-11 text-base" />
              </Field>
              <Field id="ex-venue-email" label="Email">
                <Input id="ex-venue-email" type="email" inputMode="email" value={form.venueEmail} onChange={(e) => patch({ venueEmail: e.target.value })} maxLength={160} autoComplete="off" className="h-11 text-base" />
              </Field>
            </div>
            <Field id="ex-venue-site" label="Website">
              <Input id="ex-venue-site" inputMode="url" value={form.venueWebsite} onChange={(e) => patch({ venueWebsite: e.target.value })} placeholder="https://" className="h-11 text-base" />
            </Field>
          </Section>

          <Section id="ex-albums" title="Artwork albums" hint="Photos from these gallery albums appear on the exhibition page, in the order you pick them.">
            {albums.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImagesIcon className="size-4" aria-hidden="true" />
                No gallery albums yet. Create one under Gallery first.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {albums.map((album) => {
                  const position = form.albumIds.indexOf(album.id)
                  const selected = position !== -1
                  return (
                    <li key={album.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleAlbum(album.id)}
                        className={cn(
                          "flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          selected ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                            selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                          )}
                          aria-hidden="true"
                        >
                          {selected ? position + 1 : <CheckIcon className="size-3 opacity-0" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">{album.title}</span>
                        {album.status !== "published" && <span className="shrink-0 text-xs capitalize">{album.status}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>

          <section className="flex flex-col gap-3" aria-label="Visibility">
            <ToggleRow
              id="ex-submissions"
              label="Accept artwork submissions"
              hint="Adds the open-call form to the exhibition page."
              checked={form.submissionsEnabled}
              onChange={(submissionsEnabled) => patch({ submissionsEnabled })}
            />
            {submissionsBlocked && (
              <p className="-mt-1 rounded-md bg-accent/15 px-3 py-2 text-xs text-foreground">
                Artists can only submit while the status is set to Open call.
              </p>
            )}
            <ToggleRow id="ex-featured" label="Feature this exhibition" hint="Highlights it at the top of the Artists Gallery." checked={form.featured} onChange={(featured) => patch({ featured })} />
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="ex-status" label="Status" hint={isAdmin ? statusHint : "An admin changes the status."}>
              <Select
                items={EXHIBITION_STATUS_OPTIONS}
                value={form.status}
                onValueChange={(value) => patch({ status: value ?? "draft" })}
                disabled={!isAdmin}
              >
                <SelectTrigger id="ex-status" className="h-11 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXHIBITION_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="ex-slug" label="Web address" hint={`/artists-gallery/exhibitions/${form.slug || "..."}`}>
              <Input
                id="ex-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  patch({ slug: slugify(e.target.value) })
                }}
                className="h-11 text-base"
              />
            </Field>
          </div>
        </form>

        <DialogFooter className="m-0 shrink-0 flex-row justify-end gap-2 rounded-t-none border-t border-border bg-popover px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
          <Button type="button" variant="outline" className="h-11 flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="submit" form="exhibition-form" className="h-11 flex-1 sm:flex-none" disabled={pending}>
            {pending ? "Saving..." : exhibitionId ? "Save changes" : "Create exhibition"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
