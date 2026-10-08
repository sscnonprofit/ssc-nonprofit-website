"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { saveJobAction } from "@/app/admin/job-actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/builder/schema"
import { EMPLOYMENT_TYPES, JOB_STATUS_OPTIONS, type JobForm } from "@/lib/employment/job-constants"

function blankForm(): JobForm {
  return {
    title: "",
    slug: "",
    department: "",
    location: "",
    employmentType: "full_time",
    summary: "",
    description: "",
    requirements: "",
    benefits: "",
    payRange: "",
    status: "draft",
    featured: false,
    applicationsEnabled: true,
    closingDate: "",
    contactName: "",
    contactEmail: "",
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

export function JobFormDialog({
  open,
  onOpenChange,
  jobId,
  initial,
  role,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: number | null
  initial: JobForm | null
  role: string
  onSaved: () => void
}) {
  const [form, setForm] = useState<JobForm>(blankForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [pending, startTransition] = useTransition()
  const isAdmin = role === "admin"

  // Load once per opening so a background refresh never wipes unsaved edits.
  const loadKey = open ? String(jobId ?? "new") : null
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  if (loadKey !== loadedKey) {
    setLoadedKey(loadKey)
    if (loadKey) {
      setForm(initial ?? blankForm())
      setSlugTouched(Boolean(initial))
    }
  }

  function patch(values: Partial<JobForm>) {
    setForm((current) => ({ ...current, ...values }))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveJobAction({ ...form, id: jobId ?? undefined })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(jobId ? "Job posting saved" : "Job posting created")
      onOpenChange(false)
      onSaved()
    })
  }

  const statusHint = JOB_STATUS_OPTIONS.find((item) => item.value === form.status)?.hint
  const applicationsBlocked = form.applicationsEnabled && form.status !== "open"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:max-w-3xl">
        <DialogHeader className="shrink-0 gap-1 border-b border-border py-4 pr-14 pl-4 text-left sm:px-6 sm:py-5 sm:pr-16">
          <DialogTitle className="text-lg leading-tight text-balance">{jobId ? "Edit job posting" : "New job posting"}</DialogTitle>
          <DialogDescription className="text-pretty">Drafts and archived postings stay hidden from the Employment page.</DialogDescription>
        </DialogHeader>

        <form id="job-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="job-title" label="Job title">
              <Input
                id="job-title"
                value={form.title}
                onChange={(e) => patch(slugTouched ? { title: e.target.value } : { title: e.target.value, slug: slugify(e.target.value) })}
                required
                maxLength={160}
                className="h-11 text-base"
              />
            </Field>
            <Field id="job-department" label="Department">
              <Input id="job-department" value={form.department} onChange={(e) => patch({ department: e.target.value })} maxLength={160} placeholder="Nursing" className="h-11 text-base" />
            </Field>
            <Field id="job-location" label="Location">
              <Input id="job-location" value={form.location} onChange={(e) => patch({ location: e.target.value })} maxLength={160} placeholder="Sheboygan, WI" className="h-11 text-base" />
            </Field>
            <Field id="job-type" label="Employment type">
              <Select value={form.employmentType} onValueChange={(value) => patch({ employmentType: value ?? "full_time" })}>
                <SelectTrigger id="job-type" className="h-11 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field id="job-pay" label="Pay range" hint="Optional. Shown to applicants, e.g. $18-$24/hr.">
            <Input id="job-pay" value={form.payRange} onChange={(e) => patch({ payRange: e.target.value })} maxLength={120} className="h-11 text-base" />
          </Field>

          <Field id="job-summary" label="Short summary" hint="Shown in the job list.">
            <Textarea id="job-summary" value={form.summary} onChange={(e) => patch({ summary: e.target.value })} rows={2} maxLength={400} className="text-base" />
          </Field>

          <Field id="job-description" label="Full description" hint="Blank lines start a new paragraph.">
            <Textarea id="job-description" value={form.description} onChange={(e) => patch({ description: e.target.value })} rows={6} maxLength={6000} className="text-base" />
          </Field>

          <Field id="job-requirements" label="Requirements" hint="One per line.">
            <Textarea id="job-requirements" value={form.requirements} onChange={(e) => patch({ requirements: e.target.value })} rows={4} maxLength={4000} className="text-base" />
          </Field>

          <Field id="job-benefits" label="Benefits" hint="One per line.">
            <Textarea id="job-benefits" value={form.benefits} onChange={(e) => patch({ benefits: e.target.value })} rows={4} maxLength={4000} className="text-base" />
          </Field>

          <Section id="job-contact" title="Contact and deadline" hint="Shown to applicants and used for internal follow-up.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="job-contact-name" label="Contact name">
                <Input id="job-contact-name" value={form.contactName} onChange={(e) => patch({ contactName: e.target.value })} maxLength={160} className="h-11 text-base" />
              </Field>
              <Field id="job-contact-email" label="Contact email">
                <Input id="job-contact-email" type="email" inputMode="email" value={form.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} maxLength={160} autoComplete="off" className="h-11 text-base" />
              </Field>
              <Field id="job-closing" label="Applications close" hint="Optional. Applications close automatically after this.">
                <Input id="job-closing" type="datetime-local" value={form.closingDate} onChange={(e) => patch({ closingDate: e.target.value })} className="h-11 text-base" />
              </Field>
            </div>
          </Section>

          <section className="flex flex-col gap-3" aria-label="Visibility">
            <ToggleRow
              id="job-applications"
              label="Accept applications"
              hint="Adds the application form to the job page."
              checked={form.applicationsEnabled}
              onChange={(applicationsEnabled) => patch({ applicationsEnabled })}
            />
            {applicationsBlocked && (
              <p className="-mt-1 rounded-md bg-accent/15 px-3 py-2 text-xs text-foreground">
                Applicants can only apply while the status is set to Open.
              </p>
            )}
            <ToggleRow id="job-featured" label="Feature this posting" hint="Highlights it at the top of the job list." checked={form.featured} onChange={(featured) => patch({ featured })} />
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="job-status" label="Status" hint={isAdmin ? statusHint : "An admin changes the status."}>
              <Select value={form.status} onValueChange={(value) => patch({ status: value ?? "draft" })} disabled={!isAdmin}>
                <SelectTrigger id="job-status" className="h-11 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="job-slug" label="Web address" hint={`/employment/${form.slug || "..."}`}>
              <Input
                id="job-slug"
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
          <Button type="submit" form="job-form" className="h-11 flex-1 sm:flex-none" disabled={pending}>
            {pending ? "Saving..." : jobId ? "Save changes" : "Create job posting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
