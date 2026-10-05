"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDownIcon, ArrowUpIcon, ImageIcon, PlusIcon, StarIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { createAlbumAction, deleteAlbumAction, reorderAlbumsAction } from "@/app/admin/gallery-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { AdminAlbum } from "@/lib/events/data"

export function AlbumsManager({ albums: initial, role }: { albums: AdminAlbum[]; role: string }) {
  const router = useRouter()
  const [albums, setAlbums] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [toDelete, setToDelete] = useState<AdminAlbum | null>(null)

  const canEdit = role === "admin" || role === "editor"

  function create() {
    startTransition(async () => {
      const result = await createAlbumAction({ title })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Album created")
      router.push(`/admin/gallery/${result.data?.id}`)
    })
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= albums.length) return
    const next = [...albums]
    ;[next[index], next[target]] = [next[target], next[index]]
    setAlbums(next)
    startTransition(async () => {
      const result = await reorderAlbumsAction(next.map((album) => album.id))
      if (!result.ok) {
        toast.error(result.error)
        setAlbums(albums)
      }
    })
  }

  function confirmDelete() {
    if (!toDelete) return
    const album = toDelete
    startTransition(async () => {
      const result = await deleteAlbumAction(album.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setAlbums((current) => current.filter((item) => item.id !== album.id))
      setToDelete(null)
      toast.success("Album deleted")
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit ? (
        <Button className="h-11 w-full sm:w-fit" onClick={() => setCreating(true)}>
          <PlusIcon className="size-4" />
          New album
        </Button>
      ) : null}

      {albums.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <ImageIcon className="size-8 text-muted-foreground" />
          <p className="font-medium text-foreground">No albums yet</p>
          <p className="text-sm text-muted-foreground">Create your first album, then upload photos into it.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {albums.map((album, index) => (
            <li key={album.id} className="flex items-stretch gap-3 rounded-xl border border-border bg-card p-3">
              <Link
                href={`/admin/gallery/${album.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {album.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.coverUrl || "/placeholder.svg"} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-pretty font-medium text-foreground">
                    <span className="truncate">{album.title}</span>
                    {album.featured ? <StarIcon className="size-3.5 shrink-0 fill-current text-primary" /> : null}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={album.status === "published" ? "default" : "secondary"}>
                      {album.status === "published" ? "Published" : "Draft"}
                    </Badge>
                    {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
                  </span>
                </div>
              </Link>
              {canEdit ? (
                <div className="flex shrink-0 flex-col justify-between">
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11"
                      disabled={pending || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUpIcon className="size-4" />
                      <span className="sr-only">Move {album.title} up</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11"
                      disabled={pending || index === albums.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDownIcon className="size-4" />
                      <span className="sr-only">Move {album.title} down</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 text-destructive"
                      disabled={pending || (album.status === "published" && role !== "admin")}
                      onClick={() => setToDelete(album)}
                    >
                      <Trash2Icon className="size-4" />
                      <span className="sr-only">Delete {album.title}</span>
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New album</DialogTitle>
            <DialogDescription>Give it a name. You can add photos and details on the next screen.</DialogDescription>
          </DialogHeader>
          <form
            id="create-album"
            onSubmit={(event) => {
              event.preventDefault()
              create()
            }}
          >
            <label htmlFor="album-title" className="sr-only">
              Album name
            </label>
            <Input
              id="album-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Spring showcase 2026"
              className="h-11 text-base"
              maxLength={120}
              autoFocus
            />
          </form>
          <DialogFooter>
            <Button variant="outline" className="h-11" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-album" className="h-11" disabled={pending || !title.trim()}>
              Create album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this album?</DialogTitle>
            <DialogDescription>
              {toDelete?.title} and its {toDelete?.photoCount} photo records will be removed. The image files stay in the
              media library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-11" onClick={() => setToDelete(null)}>
              Keep album
            </Button>
            <Button variant="destructive" className="h-11" disabled={pending} onClick={confirmDelete}>
              Delete album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
