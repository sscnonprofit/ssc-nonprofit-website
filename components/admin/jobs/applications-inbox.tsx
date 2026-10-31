"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileTextIcon,
  InboxIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { deleteApplicationAction, updateApplicationStatusAction } from "@/app/admin/job-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { APPLICATION_STATUSES, applicationStatusLabel, type InboxApplication } from "@/lib/employment/job-constants"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  new: "bg-accent/25 text-foreground",
  under_review: "bg-muted text-foreground",
  interviewing: "bg-primary/15 text-primary",
  offer: "bg-primary/15 text-primary",
  hired: "bg-primary/25 text-primary",
  declined: "bg-destructive/15 text-destructive",
}

const SITE_TIME_ZONE = "America/Chicago"

function formatDate(iso: string, withTime = false) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: SITE_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: SITE_TIME_ZONE, month: "short", day: "numeric" })
}

function Fact({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground text-pretty">{value}</dd>
    </div>
  )
}

function ApplicantDetail({
  application,
  canEdit,
  isAdmin,
  onBack,
  onChanged,
  onRemoved,
}: {
  application: InboxApplication
  canEdit: boolean
  isAdmin: boolean
  onBack: () => void
  onChanged: () => void
  onRemoved: () => void
}) {
  const [notes, setNotes] = useState(application.reviewNotes)
  const [pending, startTransition] = useTransition()
  const notesChanged = notes !== application.reviewNotes

  function save(status: string, message: string) {
    startTransition(async () => {
      const result = await updateApplicationStatusAction(application.id, status, notes)
      if (!result.ok) return void toast.error(result.error)
      toast.success(message)
      onChanged()
    })
  }

  function remove() {
    if (!window.confirm(`Delete the application from ${application.fullName}? This can't be undone.`)) return
    startTransition(async () => {
      const result = await deleteApplicationAction(application.id)
      if (!result.ok) return void toast.error(result.error)
      toast.success("Application deleted")
      onRemoved()
    })
  }

  return (
    <article className="flex flex-col gap-5" aria-label={`Application from ${application.fullName}`}>
      <Button type="button" variant="ghost" className="-ml-2 h-11 w-fit gap-2 lg:hidden" onClick={onBack}>
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        All applicants
      </Button>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl font-semibold text-foreground text-balance">{application.fullName}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Applied for <span className="font-medium text-foreground">{application.jobTitle}</span> on {formatDate(application.createdAt, true)}
            </p>
          </div>
          <Badge variant="secondary" className={STATUS_STYLES[application.status]}>
            {applicationStatusLabel(application.status)}
          </Badge>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={`mailto:${application.email}?subject=${encodeURIComponent(`Your application to ${application.jobTitle}`)}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <MailIcon className="size-4" aria-hidden="true" />
            Email applicant
          </a>
          {application.phone && (
            <a
              href={`tel:${application.phone.replace(/[^\d+]/g, "")}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              <PhoneIcon className="size-4" aria-hidden="true" />
              {application.phone}
            </a>
          )}
          {application.resumeUrl && (
            <a
              href={application.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              <FileTextIcon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{application.resumeFilename || "View resume"}</span>
            </a>
          )}
        </div>
      </header>

      {canEdit && (
        <section aria-labelledby="stage-heading" className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <h3 id="stage-heading" className="text-sm font-semibold text-foreground">
            Move to stage
          </h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label={`Stage for ${application.fullName}`}>
            {APPLICATION_STATUSES.map((status) => (
              <Button
                key={status.value}
                type="button"
                variant={application.status === status.value ? "default" : "outline"}
                className="h-11"
                disabled={pending || application.status === status.value}
                aria-pressed={application.status === status.value}
                onClick={() => save(status.value, `Moved to ${status.label.toLowerCase()}`)}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="about-heading" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <h3 id="about-heading" className="text-sm font-semibold text-foreground">
          Applicant details
        </h3>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Fact label="Email" value={application.email} />
          <Fact label="Phone" value={application.phone} />
          <Fact label="Availability" value={application.availability} />
          <Fact label="Desired pay" value={application.desiredPay} />
          <Fact label="Experience" value={application.yearsExperience} />
          <Fact label="Available to start" value={application.startDate} />
          <Fact label="Heard about us via" value={application.referralSource} />
        </dl>
        {application.address && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {application.address}
          </p>
        )}
        {application.eligibleToWork && (
          <p className="inline-flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2Icon className="size-4 text-primary" aria-hidden="true" />
            Confirmed eligible to work in the United States
          </p>
        )}
      </section>

      {application.coverLetter && (
        <section aria-labelledby="letter-heading" className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <h3 id="letter-heading" className="text-sm font-semibold text-foreground">
            Cover letter
          </h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{application.coverLetter}</p>
        </section>
      )}

      {canEdit && (
        <section aria-labelledby="notes-heading" className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <Label htmlFor={`inbox-notes-${application.id}`} id="notes-heading" className="text-sm font-semibold">
            Review notes
            <span className="font-normal text-muted-foreground"> (staff only)</span>
          </Label>
          <Textarea
            id={`inbox-notes-${application.id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Interview impressions, references, next steps"
            className="text-base"
          />
          <div className="flex items-center gap-3">
            <Button type="button" className="h-11" disabled={pending || !notesChanged} onClick={() => save(application.status, "Notes saved")}>
              Save notes
            </Button>
            {notesChanged && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
          </div>
        </section>
      )}

      {isAdmin && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" className="h-11 text-destructive" disabled={pending} onClick={remove}>
            <Trash2Icon className="size-4" aria-hidden="true" />
            Delete application
          </Button>
        </div>
      )}
    </article>
  )
}

export function ApplicationsInbox({
  applications,
  jobs,
  role,
  initialJobId,
}: {
  applications: InboxApplication[]
  jobs: { id: number; title: string }[]
  role: string
  initialJobId: number | null
}) {
  const router = useRouter()
  const canEdit = role === "admin" || role === "editor"
  const isAdmin = role === "admin"

  const [status, setStatus] = useState("all")
  const [jobId, setJobId] = useState<number | null>(initialJobId)
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const forJob = useMemo(() => (jobId === null ? applications : applications.filter((item) => item.jobId === jobId)), [applications, jobId])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return forJob
      .filter((item) => status === "all" || item.status === status)
      .filter((item) => !needle || `${item.fullName} ${item.email} ${item.phone} ${item.jobTitle}`.toLowerCase().includes(needle))
  }, [forJob, status, query])

  const selected = visible.find((item) => item.id === selectedId) ?? null
  const desktopSelected = selected ?? visible[0] ?? null

  const newTotal = applications.filter((item) => item.status === "new").length

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
        <InboxIcon className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium text-foreground">No applications yet</p>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          When someone applies to an open position on the Employment page, they&apos;ll show up here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone, or position"
              aria-label="Search applications"
              className="h-11 pl-9 text-base"
            />
          </div>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="inbox-job-filter">
              Filter by position
            </label>
            <select
              id="inbox-job-filter"
              value={jobId ?? ""}
              onChange={(event) => {
                setJobId(event.target.value ? Number(event.target.value) : null)
                setSelectedId(null)
              }}
              className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base text-foreground sm:w-64 sm:flex-none"
            >
              <option value="">All positions</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            {jobId !== null && (
              <Button variant="outline" className="h-11 shrink-0" nativeButton={false} render={<a href={`/api/admin/jobs/${jobId}/applications`} download />}>
                <DownloadIcon className="size-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Export CSV</span>
              </Button>
            )}
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by stage">
          {[{ value: "all", label: "All" }, ...APPLICATION_STATUSES].map((item) => {
            const total = item.value === "all" ? forJob.length : forJob.filter((entry) => entry.status === item.value).length
            const active = status === item.value
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setStatus(item.value)
                  setSelectedId(null)
                }}
                className={cn(
                  "ssc-btn-shape inline-flex min-h-11 shrink-0 items-center gap-1.5 border px-4 text-sm font-medium transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                <span className="text-xs tabular-nums opacity-75">{total}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="sr-only" role="status">
        {visible.length} {visible.length === 1 ? "application" : "applications"} shown, {newTotal} new in total
      </p>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium text-foreground">No applications match</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different stage, position, or search.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <ul className={cn("flex flex-col gap-2 lg:max-h-[calc(100svh-15rem)] lg:overflow-y-auto lg:pr-1", selected && "hidden lg:flex")}>
            {visible.map((item) => {
              const active = desktopSelected?.id === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex min-h-16 w-full flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors",
                      active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/60",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        {item.status === "new" && <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="New" role="img" />}
                        <span className={cn("truncate text-foreground", item.status === "new" ? "font-semibold" : "font-medium")}>{item.fullName}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatShortDate(item.createdAt)}</span>
                    </span>
                    <span className="truncate text-sm text-muted-foreground">{item.jobTitle}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className={STATUS_STYLES[item.status]}>
                        {applicationStatusLabel(item.status)}
                      </Badge>
                      {item.resumeUrl && (
                        <Badge variant="outline" className="gap-1">
                          <FileTextIcon className="size-3" aria-hidden="true" />
                          Resume
                        </Badge>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className={cn("min-w-0", !selected && "hidden lg:block")}>
            {desktopSelected && (
              <ApplicantDetail
                key={desktopSelected.id}
                application={desktopSelected}
                canEdit={canEdit}
                isAdmin={isAdmin}
                onBack={() => setSelectedId(null)}
                onChanged={() => router.refresh()}
                onRemoved={() => {
                  setSelectedId(null)
                  router.refresh()
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
