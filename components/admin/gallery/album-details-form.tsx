"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateAlbumAction, type AlbumUpdate } from "@/app/admin/gallery-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function AlbumDetailsForm({
  album,
  events,
  role,
}: {
  album: AlbumUpdate & { id: number }
  events: { id: number; title: string }[]
  role: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<AlbumUpdate>({
    title: album.title,
    slug: album.slug,
    description: album.description,
    status: album.status,
    featured: album.featured,
    eventId: album.eventId,
  })
  const canEdit = role === "admin" || role === "editor"
  const canPublish = role === "admin"

  function patch(next: Partial<AlbumUpdate>) {
    setForm((current) => ({ ...current, ...next }))
  }

  function save() {
    startTransition(async () => {
      const result = await updateAlbumAction(album.id, form)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      if (result.data?.slug) patch({ slug: result.data.slug })
      toast.success("Album saved")
      router.refresh()
    })
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <h2 className="font-serif text-lg font-semibold text-foreground">Album details</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="album-name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <Input
          id="album-name"
          value={form.title}
          onChange={(event) => patch({ title: event.target.value })}
          className="h-11 text-base"
          maxLength={120}
          disabled={!canEdit}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="album-slug" className="text-sm font-medium text-foreground">
          Web address
        </label>
        <Input
          id="album-slug"
          value={form.slug}
          onChange={(event) => patch({ slug: event.target.value })}
          className="h-11 text-base"
          disabled={!canEdit}
        />
        <p className="text-xs text-muted-foreground">/gallery/{form.slug || "album"}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="album-description" className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="album-description"
          value={form.description}
          onChange={(event) => patch({ description: event.target.value })}
          rows={3}
          maxLength={600}
          disabled={!canEdit}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="album-event" className="text-sm font-medium text-foreground">
            Linked event
          </label>
          <select
            id="album-event"
            value={form.eventId ?? ""}
            onChange={(event) => patch({ eventId: event.target.value ? Number(event.target.value) : null })}
            disabled={!canEdit}
            className={fieldClass}
          >
            <option value="">None</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="album-status" className="text-sm font-medium text-foreground">
            Status
          </label>
          <select
            id="album-status"
            value={form.status}
            onChange={(event) => patch({ status: event.target.value })}
            disabled={!canPublish}
            className={fieldClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          {!canPublish ? <p className="text-xs text-muted-foreground">Only admins can publish albums.</p> : null}
        </div>
      </div>

      <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(event) => patch({ featured: event.target.checked })}
          disabled={!canEdit}
          className="size-5 accent-primary"
        />
        Feature this album on the gallery page
      </label>

      {canEdit ? (
        <Button type="submit" className="h-11 w-full sm:w-fit" disabled={pending || !form.title.trim()}>
          {pending ? "Saving..." : "Save details"}
        </Button>
      ) : null}
    </form>
  )
}
