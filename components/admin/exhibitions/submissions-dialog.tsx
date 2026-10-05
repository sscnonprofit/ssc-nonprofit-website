"use client"

import { useState, useTransition } from "react"
import useSWR from "swr"
import { DownloadIcon, ExternalLinkIcon, MailIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import {
  deleteSubmissionAction,
  listSubmissionsAction,
  updateSubmissionStatusAction,
  type AdminSubmission,
} from "@/app/admin/exhibition-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatEventDate } from "@/lib/events/occurrences"
import { SUBMISSION_STATUSES, submissionStatusLabel } from "@/lib/gallery/exhibition-constants"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-accent/20 text-foreground",
  under_review: "bg-muted text-foreground",
  accepted: "bg-primary/15 text-primary",
  waitlisted: "bg-muted text-muted-foreground",
  declined: "bg-destructive/15 text-destructive",
}

async function loadSubmissions([, id]: [string, number]) {
  const result = await listSubmissionsAction(id)
  if (!result.ok) throw new Error(result.error)
  return result.data ?? []
}

function SubmissionCard({
  submission,
  canEdit,
  isAdmin,
  onChanged,
}: {
  submission: AdminSubmission
  canEdit: boolean
  isAdmin: boolean
  onChanged: () => void
}) {
  const [notes, setNotes] = useState(submission.reviewNotes)
  const [pending, startTransition] = useTransition()

  function save(status: string, message: string) {
    startTransition(async () => {
      const result = await updateSubmissionStatusAction(submission.id, status, notes)
      if (!result.ok) return void toast.error(result.error)
      toast.success(message)
      onChanged()
    })
  }

  function remove() {
    if (!window.confirm(`Delete the submission "${submission.artworkTitle}" by ${submission.artistName}?`)) return
    startTransition(async () => {
      const result = await deleteSubmissionAction(submission.id)
      if (!result.ok) return void toast.error(result.error)
      toast.success("Submission deleted")
      onChanged()
    })
  }

  const details = [submission.medium, submission.dimensions, submission.yearCreated, submission.editionInfo].filter(Boolean).join(" · ")
  const price = submission.notForSale ? "Not for sale" : submission.askingPrice

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground text-pretty">{submission.artworkTitle}</p>
          <p className="text-sm text-muted-foreground">
            {submission.artistName} · submitted {formatEventDate(new Date(submission.createdAt), { month: "short", day: "numeric" })}
          </p>
        </div>
        <Badge variant="secondary" className={STATUS_STYLES[submission.status]}>
          {submissionStatusLabel(submission.status)}
        </Badge>
      </div>

      {submission.imageUrls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {submission.imageUrls.map((url, index) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="shrink-0">
              <img src={url || "/placeholder.svg"} alt={`${submission.artworkTitle}, image ${index + 1}`} className="size-24 rounded-lg border border-border object-cover" />
            </a>
          ))}
        </div>
      )}

      {(details || price) && (
        <p className="text-sm text-foreground">
          {details}
          {details && price ? " · " : ""}
          {price}
        </p>
      )}
      {submission.artworkDescription && <p className="text-sm leading-relaxed text-muted-foreground">{submission.artworkDescription}</p>}

      <details className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <summary className="min-h-8 cursor-pointer font-medium text-foreground">Artist details</summary>
        <div className="flex flex-col gap-2 pt-2 text-muted-foreground">
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a href={`mailto:${submission.artistEmail}`} className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline">
              <MailIcon className="size-3.5" aria-hidden="true" />
              {submission.artistEmail}
            </a>
            {submission.artistPhone && <span>{submission.artistPhone}</span>}
            {submission.portfolioUrl && (
              <a href={submission.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline">
                Portfolio
                <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
              </a>
            )}
            {submission.socialHandles && <span>{submission.socialHandles}</span>}
          </p>
          {submission.artistBio && <p className="leading-relaxed">{submission.artistBio}</p>}
          {submission.artistStatement && <p className="leading-relaxed italic">{submission.artistStatement}</p>}
        </div>
      </details>

      {canEdit && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`notes-${submission.id}`} className="text-xs text-muted-foreground">
            Review notes (staff only)
          </Label>
          <Textarea id={`notes-${submission.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} className="text-base" />
          <div className="flex flex-wrap gap-2" role="group" aria-label={`Review ${submission.artworkTitle}`}>
            {SUBMISSION_STATUSES.map((status) => (
              <Button
                key={status.value}
                type="button"
                size="sm"
                variant={submission.status === status.value ? "default" : "outline"}
                className="h-10"
                disabled={pending}
                aria-pressed={submission.status === status.value}
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

export function SubmissionsDialog({
  exhibition,
  canEdit,
  isAdmin,
  onClose,
  onChanged,
}: {
  exhibition: { id: number; title: string } | null
  canEdit: boolean
  isAdmin: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [filter, setFilter] = useState<string>("all")
  const { data, error, isLoading, mutate } = useSWR(exhibition ? (["exhibition-submissions", exhibition.id] as [string, number]) : null, loadSubmissions)
  const submissions = data ?? []
  const visible = filter === "all" ? submissions : submissions.filter((item) => item.status === filter)

  function changed() {
    mutate()
    onChanged()
  }

  return (
    <Dialog open={Boolean(exhibition)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-3rem)]">
        <DialogHeader className="shrink-0 gap-3 border-b border-border p-4 text-left sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <DialogTitle>Submissions</DialogTitle>
              <DialogDescription className="truncate">{exhibition?.title}</DialogDescription>
            </div>
            {exhibition && submissions.length > 0 && (
              <Button variant="outline" size="sm" className="h-10" nativeButton={false} render={<a href={`/api/admin/exhibitions/${exhibition.id}/submissions`} download />}>
                <DownloadIcon className="size-4" />
                Export CSV
              </Button>
            )}
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1" role="tablist" aria-label="Filter submissions">
            {[{ value: "all", label: "All" }, ...SUBMISSION_STATUSES].map((item) => {
              const count = item.value === "all" ? submissions.length : submissions.filter((s) => s.status === item.value).length
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
            <p className="py-10 text-center text-sm text-muted-foreground">Loading submissions...</p>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-destructive">{error.message}</p>
              <Button variant="outline" className="h-11" onClick={() => mutate()}>
                Try again
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {submissions.length === 0 ? "No artwork has been submitted yet." : "Nothing in this group."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((submission) => (
                <SubmissionCard key={`${submission.id}-${submission.status}`} submission={submission} canEdit={canEdit} isAdmin={isAdmin} onChanged={changed} />
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
