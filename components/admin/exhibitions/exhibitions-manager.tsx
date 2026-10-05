"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArchiveIcon,
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  ImagesIcon,
  InboxIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteExhibitionAction,
  duplicateExhibitionAction,
  setExhibitionStatusAction,
  toggleExhibitionFeaturedAction,
  toggleSubmissionsAction,
} from "@/app/admin/exhibition-actions"
import { ExhibitionFormDialog } from "@/components/admin/exhibitions/exhibition-form-dialog"
import { SubmissionsDialog } from "@/components/admin/exhibitions/submissions-dialog"
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
import { PUBLIC_EXHIBITION_STATUSES, exhibitionStatusLabel, type AdminExhibition, type AlbumOption } from "@/lib/gallery/exhibition-constants"
import { cn } from "@/lib/utils"

const FILTERS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "open", label: "Open call" },
  { value: "draft", label: "Drafts" },
  { value: "past", label: "Closed & archived" },
] as const

type Filter = (typeof FILTERS)[number]["value"]

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-accent/20 text-foreground",
  upcoming: "bg-primary/10 text-primary",
  active: "bg-primary/15 text-primary",
  closed: "bg-muted text-foreground",
  archived: "bg-muted text-muted-foreground",
}

function isLive(status: string) {
  return (PUBLIC_EXHIBITION_STATUSES as string[]).includes(status) && status !== "closed"
}

function dateRange(item: AdminExhibition) {
  if (!item.startsAt) return "Dates not set"
  const start = formatEventDate(new Date(item.startsAt), { month: "short", day: "numeric", year: "numeric" })
  if (!item.endsAt) return `Opens ${start}`
  return `${start} to ${formatEventDate(new Date(item.endsAt), { month: "short", day: "numeric", year: "numeric" })}`
}

function deadlineLabel(item: AdminExhibition) {
  if (!item.submissionDeadline) return null
  const deadline = new Date(item.submissionDeadline)
  const days = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return "Deadline passed"
  if (days === 0) return "Deadline today"
  return `Deadline in ${days} ${days === 1 ? "day" : "days"}`
}

export function ExhibitionsManager({
  exhibitions,
  albums,
  role,
  initialEditId,
}: {
  exhibitions: AdminExhibition[]
  albums: AlbumOption[]
  role: string
  initialEditId: number | null
}) {
  const router = useRouter()
  const initialExists = initialEditId !== null && exhibitions.some((item) => item.id === initialEditId)
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(initialExists)
  const [editingId, setEditingId] = useState<number | null>(initialExists ? initialEditId : null)
  const [reviewing, setReviewing] = useState<{ id: number; title: string } | null>(null)
  const [deleting, setDeleting] = useState<AdminExhibition | null>(null)
  const [pending, startTransition] = useTransition()
  const canEdit = role === "admin" || role === "editor"
  const isAdmin = role === "admin"

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return exhibitions
      .filter((item) => {
        if (needle && !`${item.title} ${item.venueName}`.toLowerCase().includes(needle)) return false
        if (filter === "live") return isLive(item.status)
        if (filter === "open") return item.status === "open"
        if (filter === "draft") return item.status === "draft"
        if (filter === "past") return item.status === "closed" || item.status === "archived"
        return true
      })
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        const aDate = a.startsAt ? new Date(a.startsAt).getTime() : Number.MAX_SAFE_INTEGER
        const bDate = b.startsAt ? new Date(b.startsAt).getTime() : Number.MAX_SAFE_INTEGER
        return aDate - bDate
      })
  }, [exhibitions, filter, query])

  const summary = useMemo(
    () => ({
      live: exhibitions.filter((item) => isLive(item.status)).length,
      toReview: exhibitions.reduce((sum, item) => sum + item.pendingCount, 0),
      accepted: exhibitions.reduce((sum, item) => sum + item.acceptedCount, 0),
      drafts: exhibitions.filter((item) => item.status === "draft").length,
    }),
    [exhibitions],
  )

  const editing = editingId ? exhibitions.find((item) => item.id === editingId) : null

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
    if (!open && initialEditId !== null) router.replace("/admin/exhibitions", { scroll: false })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Exhibitions at a glance">
        {[
          { label: "Live exhibitions", value: summary.live, filterTo: "live" as Filter },
          { label: "Submissions to review", value: summary.toReview, filterTo: "open" as Filter },
          { label: "Accepted artworks", value: summary.accepted, filterTo: "all" as Filter },
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
            placeholder="Search exhibitions"
            aria-label="Search exhibitions"
            className="h-11 pl-9 text-base"
          />
        </div>
        {canEdit && (
          <Button className="h-11" onClick={() => openEditor(null)}>
            <PlusIcon className="size-4" />
            New exhibition
          </Button>
        )}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter exhibitions">
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
          <p className="font-medium text-foreground">{exhibitions.length === 0 ? "No exhibitions yet" : "No exhibitions match"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {exhibitions.length === 0 ? "Create an exhibition to showcase artwork and run an open call." : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item) => {
            const deadline = item.status === "open" && item.submissionsEnabled ? deadlineLabel(item) : null
            return (
              <li key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-20" aria-hidden="true">
                  {item.coverUrl ? (
                    <img src={item.coverUrl || "/placeholder.svg"} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImagesIcon className="size-5" />
                    </div>
                  )}
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
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {dateRange(item)}
                    {item.venueName && ` · ${item.venueName}`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className={STATUS_STYLES[item.status]}>
                      {exhibitionStatusLabel(item.status)}
                    </Badge>
                    {item.featured && (
                      <Badge variant="outline" className="gap-1">
                        <StarIcon className="size-3" aria-hidden="true" />
                        Featured
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1">
                      <ImagesIcon className="size-3" aria-hidden="true" />
                      {item.albumCount} {item.albumCount === 1 ? "album" : "albums"}
                    </Badge>
                    {(item.submissionsEnabled || item.submissionCount > 0) && (
                      <button
                        type="button"
                        onClick={() => setReviewing({ id: item.id, title: item.title })}
                        className="ssc-btn-shape inline-flex min-h-8 items-center gap-1 border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <InboxIcon className="size-3" aria-hidden="true" />
                        {item.submissionCount} {item.submissionCount === 1 ? "submission" : "submissions"}
                        {item.pendingCount > 0 && ` · ${item.pendingCount} new`}
                      </button>
                    )}
                    {deadline && (
                      <Badge variant="outline" className={cn(deadline === "Deadline passed" && "text-muted-foreground")}>
                        {deadline}
                      </Badge>
                    )}
                    {item.submissionsEnabled && item.status !== "open" && (
                      <Badge variant="outline" className="border-accent/50 text-foreground">
                        Form hidden until Open call
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
                    {(PUBLIC_EXHIBITION_STATUSES as string[]).includes(item.status) && (
                      <DropdownMenuItem className="min-h-11" render={<Link href={`/artists-gallery/exhibitions/${item.slug}`} target="_blank" />}>
                        <ExternalLinkIcon className="size-4" />
                        View on site
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="min-h-11" onClick={() => setReviewing({ id: item.id, title: item.title })}>
                      <InboxIcon className="size-4" />
                      Review submissions
                    </DropdownMenuItem>
                    {canEdit && (
                      <>
                        <DropdownMenuItem
                          className="min-h-11"
                          onClick={() =>
                            run(() => toggleSubmissionsAction(item.id, !item.submissionsEnabled), item.submissionsEnabled ? "Submissions turned off" : "Submissions turned on")
                          }
                        >
                          <InboxIcon className="size-4" />
                          {item.submissionsEnabled ? "Stop accepting submissions" : "Accept submissions"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="min-h-11" onClick={() => run(() => duplicateExhibitionAction(item.id), "Duplicated as a draft")}>
                          <CopyIcon className="size-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="min-h-11"
                          onClick={() => run(() => toggleExhibitionFeaturedAction(item.id, !item.featured), item.featured ? "Removed from featured" : "Marked as featured")}
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
                          <DropdownMenuItem className="min-h-11" onClick={() => run(() => setExhibitionStatusAction(item.id, "upcoming"), "Exhibition published")}>
                            <EyeIcon className="size-4" />
                            Publish as upcoming
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="min-h-11" onClick={() => run(() => setExhibitionStatusAction(item.id, "draft"), "Moved back to drafts")}>
                            <EyeOffIcon className="size-4" />
                            Unpublish
                          </DropdownMenuItem>
                        )}
                        {item.status !== "open" && (
                          <DropdownMenuItem className="min-h-11" onClick={() => run(() => setExhibitionStatusAction(item.id, "open"), "Open call started")}>
                            <InboxIcon className="size-4" />
                            Start open call
                          </DropdownMenuItem>
                        )}
                        {item.status !== "archived" && (
                          <DropdownMenuItem className="min-h-11" onClick={() => run(() => setExhibitionStatusAction(item.id, "archived"), "Exhibition archived")}>
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

      <ExhibitionFormDialog
        open={dialogOpen}
        onOpenChange={onDialogChange}
        exhibitionId={editingId}
        initial={editing?.form ?? null}
        albums={albums}
        role={role}
        onSaved={() => router.refresh()}
      />

      <SubmissionsDialog exhibition={reviewing} canEdit={canEdit} isAdmin={isAdmin} onClose={() => setReviewing(null)} onChanged={() => router.refresh()} />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this exhibition?</DialogTitle>
            <DialogDescription>
              {deleting?.title}
              {deleting && deleting.submissionCount > 0
                ? ` and its ${deleting.submissionCount} artwork ${deleting.submissionCount === 1 ? "submission" : "submissions"}`
                : ""}{" "}
              will be removed for good. Linked gallery albums are kept. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            {deleting && deleting.submissionCount > 0 && (
              <Button variant="outline" className="h-11" nativeButton={false} render={<a href={`/api/admin/exhibitions/${deleting.id}/submissions`} download />}>
                Export submissions
              </Button>
            )}
            <Button variant="outline" className="h-11" onClick={() => setDeleting(null)}>
              Keep exhibition
            </Button>
            <Button
              variant="destructive"
              className="h-11"
              disabled={pending}
              onClick={() => {
                const target = deleting
                setDeleting(null)
                if (target) run(() => deleteExhibitionAction(target.id), "Exhibition deleted")
              }}
            >
              Delete exhibition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
