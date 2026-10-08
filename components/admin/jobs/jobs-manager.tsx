"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArchiveIcon,
  BriefcaseIcon,
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  InboxIcon,
  MapPinIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteJobAction,
  duplicateJobAction,
  setJobStatusAction,
  toggleApplicationsAction,
  toggleJobFeaturedAction,
} from "@/app/admin/job-actions"
import { ApplicationsDialog } from "@/components/admin/jobs/applications-dialog"
import { JobFormDialog } from "@/components/admin/jobs/job-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { formatEventDate } from "@/lib/events/occurrences"
import { employmentTypeLabel, jobStatusLabel, PUBLIC_JOB_STATUSES, type AdminJob } from "@/lib/employment/job-constants"
import { cn } from "@/lib/utils"

const FILTERS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "draft", label: "Drafts" },
  { value: "past", label: "Closed & archived" },
] as const

type Filter = (typeof FILTERS)[number]["value"]

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-primary/15 text-primary",
  closed: "bg-muted text-foreground",
  archived: "bg-muted text-muted-foreground",
}

function isLive(status: string) {
  return (PUBLIC_JOB_STATUSES as string[]).includes(status)
}

function deadlineLabel(item: AdminJob) {
  if (!item.closingDate) return null
  const deadline = new Date(item.closingDate)
  const days = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return "Deadline passed"
  if (days === 0) return "Deadline today"
  return `Closes in ${days} ${days === 1 ? "day" : "days"}`
}

export function JobsManager({
  jobs,
  role,
  initialEditId,
}: {
  jobs: AdminJob[]
  role: string
  initialEditId: number | null
}) {
  const router = useRouter()
  const initialExists = initialEditId !== null && jobs.some((item) => item.id === initialEditId)
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(initialExists)
  const [editingId, setEditingId] = useState<number | null>(initialExists ? initialEditId : null)
  const [reviewing, setReviewing] = useState<{ id: number; title: string } | null>(null)
  const [deleting, setDeleting] = useState<AdminJob | null>(null)
  const [pending, startTransition] = useTransition()
  const canEdit = role === "admin" || role === "editor"
  const isAdmin = role === "admin"

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return jobs
      .filter((item) => {
        if (needle && !`${item.title} ${item.department} ${item.location}`.toLowerCase().includes(needle)) return false
        if (filter === "live") return isLive(item.status)
        if (filter === "draft") return item.status === "draft"
        if (filter === "past") return item.status === "closed" || item.status === "archived"
        return true
      })
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        return a.title.localeCompare(b.title)
      })
  }, [jobs, filter, query])

  const summary = useMemo(
    () => ({
      live: jobs.filter((item) => isLive(item.status)).length,
      toReview: jobs.reduce((sum, item) => sum + item.newCount, 0),
      hired: jobs.reduce((sum, item) => sum + item.hiredCount, 0),
      drafts: jobs.filter((item) => item.status === "draft").length,
    }),
    [jobs],
  )

  const editing = editingId ? jobs.find((item) => item.id === editingId) : null

  function run(task: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await task()
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong")
        return
      }
      toast.success(success)
      router.refresh()
    })
  }

  function openEditor(id: number | null) {
    setEditingId(id)
    setDialogOpen(true)
  }

  function onDialogChange(open: boolean) {
    setDialogOpen(open)
    // Drop a deep-link `?edit=` param so a refresh doesn't reopen the dialog.
    if (!open && initialEditId !== null) router.replace("/admin/jobs", { scroll: false })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Jobs at a glance">
        {[
          { label: "Live postings", value: summary.live, filterTo: "live" as Filter },
          { label: "Applications to review", value: summary.toReview, filterTo: "live" as Filter },
          { label: "Hired", value: summary.hired, filterTo: "all" as Filter },
          { label: "Drafts", value: summary.drafts, filterTo: "draft" as Filter },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setFilter(item.filterTo)}
            className="flex min-h-11 flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="font-serif text-2xl font-semibold leading-none text-foreground">{item.value}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search job postings"
            aria-label="Search job postings"
            className="h-11 pl-9 text-base"
          />
        </div>
        {canEdit && (
          <Button className="h-11" onClick={() => openEditor(null)}>
            <PlusIcon className="size-4" />
            New job posting
          </Button>
        )}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter jobs">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              "ssc-btn-shape inline-flex min-h-11 shrink-0 items-center border px-4 text-sm font-medium transition-colors",
              filter === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium text-foreground">{jobs.length === 0 ? "No job postings yet" : "No job postings match"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {jobs.length === 0 ? "Create a job posting to start accepting applications." : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item) => {
            const deadline = item.status === "open" && item.applicationsEnabled ? deadlineLabel(item) : null
            return (
              <li key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted sm:size-20" aria-hidden="true">
                  <BriefcaseIcon className="size-6 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => openEditor(item.id)}
                    className="block min-h-6 max-w-full text-left font-medium text-foreground hover:underline disabled:hover:no-underline"
                    disabled={!canEdit}
                  >
                    <span className="line-clamp-2 text-pretty">{item.title}</span>
                  </button>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 truncate text-sm text-muted-foreground">
                    {item.department}
                    {item.department && item.location && " · "}
                    {item.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPinIcon className="size-3" aria-hidden="true" />
                        {item.location}
                      </span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className={STATUS_STYLES[item.status]}>
                      {jobStatusLabel(item.status)}
                    </Badge>
                    {item.featured && (
                      <Badge variant="outline" className="gap-1">
                        <StarIcon className="size-3" aria-hidden="true" />
                        Featured
                      </Badge>
                    )}
                    <Badge variant="outline">{employmentTypeLabel(item.employmentType)}</Badge>
                    {(item.applicationsEnabled || item.applicationCount > 0) && (
                      <button
                        type="button"
                        onClick={() => setReviewing({ id: item.id, title: item.title })}
                        className="ssc-btn-shape inline-flex min-h-8 items-center gap-1 border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <InboxIcon className="size-3" aria-hidden="true" />
                        {item.applicationCount} {item.applicationCount === 1 ? "application" : "applications"}
                        {item.newCount > 0 && ` · ${item.newCount} new`}
                      </button>
                    )}
                    {deadline && (
                      <Badge variant="outline" className={cn(deadline === "Deadline passed" && "text-muted-foreground")}>
                        {deadline}
                      </Badge>
                    )}
                    {item.applicationsEnabled && item.status !== "open" && (
                      <Badge variant="outline" className="border-accent/50 text-foreground">
                        Form hidden until Open
                      </Badge>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-11 shrink-0" disabled={pending} />}>
                    <MoreVerticalIcon className="size-4" />
                    <span className="sr-only">Actions for {item.title}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {canEdit && (
                      <DropdownMenuItem className="min-h-11" onClick={() => openEditor(item.id)}>
                        <PencilIcon className="size-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {(PUBLIC_JOB_STATUSES as string[]).includes(item.status) && (
                      <DropdownMenuItem className="min-h-11" render={<Link href={`/employment/${item.slug}`} target="_blank" />}>
                        <ExternalLinkIcon className="size-4" />
                        View on site
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="min-h-11" onClick={() => setReviewing({ id: item.id, title: item.title })}>
                      <InboxIcon className="size-4" />
                      Review applications
                    </DropdownMenuItem>
                    {canEdit && (
                      <>
                        <DropdownMenuItem
                          className="min-h-11"
                          onClick={() =>
                            run(() => toggleApplicationsAction(item.id, !item.applicationsEnabled), item.applicationsEnabled ? "Applications turned off" : "Applications turned on")
                          }
                        >
                          <InboxIcon className="size-4" />
                          {item.applicationsEnabled ? "Stop accepting applications" : "Accept applications"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="min-h-11" onClick={() => run(() => duplicateJobAction(item.id), "Duplicated as a draft")}>
                          <CopyIcon className="size-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="min-h-11"
                          onClick={() => run(() => toggleJobFeaturedAction(item.id, !item.featured), item.featured ? "Removed from featured" : "Marked as featured")}
                        >
                          <StarIcon className="size-4" />
                          {item.featured ? "Remove featured" : "Feature"}
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        {item.status === "draft" || item.status === "archived" ? (
                          <DropdownMenuItem className="min-h-11" onClick={() => run(() => setJobStatusAction(item.id, "open"), "Job posting published")}>
                            <EyeIcon className="size-4" />
                            Publish as open
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="min-h-11" onClick={() => run(() => setJobStatusAction(item.id, "draft"), "Moved back to drafts")}>
                            <EyeOffIcon className="size-4" />
                            Unpublish
                          </DropdownMenuItem>
                        )}
                        {item.status !== "closed" && item.status !== "draft" && (
                          <DropdownMenuItem className="min-h-11" onClick={() => run(() => setJobStatusAction(item.id, "closed"), "Job posting closed")}>
                            <ArchiveIcon className="size-4" />
                            Close
                          </DropdownMenuItem>
                        )}
                        {item.status !== "archived" && (
                          <DropdownMenuItem className="min-h-11" onClick={() => run(() => setJobStatusAction(item.id, "archived"), "Job posting archived")}>
                            <ArchiveIcon className="size-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    {canEdit && (isAdmin || item.status === "draft") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" className="min-h-11" onClick={() => setDeleting(item)}>
                          <Trash2Icon className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )
          })}
        </ul>
      )}

      <JobFormDialog
        open={dialogOpen}
        onOpenChange={onDialogChange}
        jobId={editingId}
        initial={editing?.form ?? null}
        role={role}
        onSaved={() => router.refresh()}
      />

      <ApplicationsDialog job={reviewing} canEdit={canEdit} isAdmin={isAdmin} onClose={() => setReviewing(null)} onChanged={() => router.refresh()} />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this job posting?</DialogTitle>
            <DialogDescription>
              {deleting?.title}
              {deleting && deleting.applicationCount > 0
                ? ` and its ${deleting.applicationCount} ${deleting.applicationCount === 1 ? "application" : "applications"}`
                : ""}{" "}
              will be removed for good. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            {deleting && deleting.applicationCount > 0 && (
              <Button variant="outline" className="h-11" nativeButton={false} render={<a href={`/api/admin/jobs/${deleting.id}/applications`} download />}>
                Export applications
              </Button>
            )}
            <Button variant="outline" className="h-11" onClick={() => setDeleting(null)}>
              Keep job posting
            </Button>
            <Button
              variant="destructive"
              className="h-11"
              disabled={pending}
              onClick={() => {
                const target = deleting
                setDeleting(null)
                if (target) run(() => deleteJobAction(target.id), "Job posting deleted")
              }}
            >
              Delete job posting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
