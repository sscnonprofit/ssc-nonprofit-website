"use client"

import { useState, useTransition } from "react"
import useSWR from "swr"
import { CheckCircle2Icon, DownloadIcon, FileTextIcon, MailIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import {
  deleteApplicationAction,
  listApplicationsAction,
  updateApplicationStatusAction,
  type AdminApplication,
} from "@/app/admin/job-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatEventDate } from "@/lib/events/occurrences"
import { APPLICATION_STATUSES, applicationStatusLabel } from "@/lib/employment/job-constants"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  new: "bg-accent/20 text-foreground",
  under_review: "bg-muted text-foreground",
  interviewing: "bg-primary/15 text-primary",
  offer: "bg-primary/15 text-primary",
  hired: "bg-primary/20 text-primary",
  declined: "bg-destructive/15 text-destructive",
}

async function loadApplications([, id]: [string, number]) {
  const result = await listApplicationsAction(id)
  if (!result.ok) throw new Error(result.error)
  return result.data ?? []
}

function ApplicationCard({
  application,
  jobTitle,
  canEdit,
  isAdmin,
  onChanged,
}: {
  application: AdminApplication
  jobTitle: string
  canEdit: boolean
  isAdmin: boolean
  onChanged: () => void
}) {
  const [notes, setNotes] = useState(application.reviewNotes)
  const [pending, startTransition] = useTransition()

  function save(status: string, message: string) {
    startTransition(async () => {
      const result = await updateApplicationStatusAction(application.id, status, notes)
      if (!result.ok) return void toast.error(result.error)
      toast.success(message)
      onChanged()
    })
  }

  function remove() {
    if (!window.confirm(`Delete the application from ${application.fullName}?`)) return
    startTransition(async () => {
      const result = await deleteApplicationAction(application.id)
      if (!result.ok) return void toast.error(result.error)
      toast.success("Application deleted")
      onChanged()
    })
  }

  const details = [application.availability, application.desiredPay, application.yearsExperience && `${application.yearsExperience} experience`].filter(Boolean).join(" · ")

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground text-pretty">{application.fullName}</p>
          <p className="text-sm text-muted-foreground">
            Applied {formatEventDate(new Date(application.createdAt), { month: "short", day: "numeric" })}
            {application.eligibleToWork && (
              <span className="ml-2 inline-flex items-center gap-1 text-foreground">
                <CheckCircle2Icon className="size-3.5" aria-hidden="true" />
                Eligible to work
              </span>
            )}
          </p>
        </div>
        <Badge variant="secondary" className={STATUS_STYLES[application.status]}>
          {applicationStatusLabel(application.status)}
        </Badge>
      </div>

      {details && <p className="text-sm text-foreground">{details}</p>}
      {application.coverLetter && <p className="text-sm leading-relaxed text-muted-foreground">{application.coverLetter}</p>}

      <div className="flex flex-wrap gap-2">
        {application.resumeUrl && (
          <a
            href={application.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <FileTextIcon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{application.resumeFilename || "View resume"}</span>
          </a>
        )}
        <a
          href={`mailto:${application.email}?subject=${encodeURIComponent(`Your application to ${jobTitle}`)}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          <MailIcon className="size-4" aria-hidden="true" />
          Reply
        </a>
      </div>

      <details className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <summary className="min-h-8 cursor-pointer font-medium text-foreground">Contact details</summary>
        <div className="flex flex-col gap-2 pt-2 text-muted-foreground">
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a href={`mailto:${application.email}`} className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline">
              <MailIcon className="size-3.5" aria-hidden="true" />
              {application.email}
            </a>
            {application.phone && <span>{application.phone}</span>}
            {application.startDate && <span>Available {application.startDate}</span>}
            {application.referralSource && <span>Heard about us via {application.referralSource}</span>}
          </p>
          {application.address && <p>{application.address}</p>}
        </div>
      </details>

      {canEdit && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`notes-${application.id}`} className="text-xs text-muted-foreground">
            Review notes (staff only)
          </Label>
          <Textarea id={`notes-${application.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} className="text-base" />
          {notes !== application.reviewNotes && (
            <Button type="button" size="sm" className="h-10 w-fit" disabled={pending} onClick={() => save(application.status, "Notes saved")}>
              Save notes
            </Button>
          )}
          <div className="flex flex-wrap gap-2" role="group" aria-label={`Review ${application.fullName}`}>
            {APPLICATION_STATUSES.map((status) => (
              <Button
                key={status.value}
                type="button"
                size="sm"
                variant={application.status === status.value ? "default" : "outline"}
                className="h-10"
                disabled={pending}
                aria-pressed={application.status === status.value}
                onClick={() => save(status.value, `Marked as ${status.label.toLowerCase()}`)}
              >
                {status.label}
              </Button>
            ))}
            {isAdmin && (
              <Button type="button" size="sm" variant="ghost" className="ml-auto h-10 text-destructive" disabled={pending} onClick={remove}>
                <Trash2Icon className="size-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

export function ApplicationsDialog({
  job,
  canEdit,
  isAdmin,
  onClose,
  onChanged,
}: {
  job: { id: number; title: string } | null
  canEdit: boolean
  isAdmin: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [filter, setFilter] = useState<string>("all")
  const [query, setQuery] = useState("")
  const { data, error, isLoading, mutate } = useSWR(job ? (["job-applications", job.id] as [string, number]) : null, loadApplications)
  const applications = data ?? []
  const needle = query.trim().toLowerCase()
  const visible = applications
    .filter((item) => filter === "all" || item.status === filter)
    .filter((item) => !needle || `${item.fullName} ${item.email} ${item.phone}`.toLowerCase().includes(needle))

  function changed() {
    mutate()
    onChanged()
  }

  return (
    <Dialog open={Boolean(job)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-3rem)]">
        <DialogHeader className="shrink-0 gap-3 border-b border-border p-4 text-left sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <DialogTitle>Applications</DialogTitle>
              <DialogDescription className="truncate">{job?.title}</DialogDescription>
            </div>
            {job && applications.length > 0 && (
              <Button variant="outline" size="sm" className="h-10" nativeButton={false} render={<a href={`/api/admin/jobs/${job.id}/applications`} download />}>
                <DownloadIcon className="size-4" />
                Export CSV
              </Button>
            )}
          </div>
          {applications.length > 3 && (
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or phone"
              aria-label="Search applications"
              className="h-10 text-base"
            />
          )}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1" role="tablist" aria-label="Filter applications">
            {[{ value: "all", label: "All" }, ...APPLICATION_STATUSES].map((item) => {
              const count = item.value === "all" ? applications.length : applications.filter((a) => a.status === item.value).length
              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.value}
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    "ssc-btn-shape inline-flex min-h-10 shrink-0 items-center gap-1.5 border px-3 text-sm font-medium transition-colors",
                    filter === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  <span className="text-xs opacity-75">{count}</span>
                </button>
              )
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading applications...</p>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-destructive">{error.message}</p>
              <Button variant="outline" className="h-11" onClick={() => mutate()}>
                Try again
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {applications.length === 0 ? "No one has applied yet." : "Nothing in this group."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((application) => (
                <ApplicationCard
                  key={`${application.id}-${application.status}`}
                  application={application}
                  jobTitle={job?.title ?? "this position"}
                  canEdit={canEdit}
                  isAdmin={isAdmin}
                  onChanged={changed}
                />
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
