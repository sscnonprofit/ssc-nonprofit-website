"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CheckIcon, GripVerticalIcon, PencilIcon, StarIcon, Trash2Icon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import {
  addPhotosAction,
  deletePhotosAction,
  reorderPhotosAction,
  setAlbumCoverAction,
  updatePhotoAction,
} from "@/app/admin/gallery-actions"
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
import { cn } from "@/lib/utils"

type Photo = { id: number; url: string; alt: string; caption: string }

function Tile({
  photo,
  isCover,
  selected,
  onSelect,
  onEdit,
  onCover,
}: {
  photo: Photo
  isCover: boolean
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onCover: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative aspect-square overflow-hidden rounded-lg border bg-muted",
        selected ? "border-primary ring-2 ring-primary" : "border-border",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url || "/placeholder.svg"} alt={photo.alt} loading="lazy" className="size-full object-cover" />

      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="absolute left-0 top-0 flex size-11 items-center justify-center"
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-md border-2",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/70 bg-background/70",
          )}
        >
          {selected ? <CheckIcon className="size-4" /> : null}
        </span>
        <span className="sr-only">Select photo</span>
      </button>

      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="absolute right-0 top-0 flex size-11 touch-none items-center justify-center"
      >
        <span className="flex size-8 items-center justify-center rounded-md bg-background/80 text-foreground">
          <GripVerticalIcon className="size-4" />
        </span>
        <span className="sr-only">Drag to reorder</span>
      </button>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-background/90 to-transparent px-0.5 pt-4">
        <button
          type="button"
          onClick={onCover}
          aria-pressed={isCover}
          className="flex size-11 items-center justify-center text-foreground"
        >
          <StarIcon className={cn("size-5", isCover && "fill-current text-primary")} />
          <span className="sr-only">{isCover ? "Album cover" : "Set as cover"}</span>
        </button>
        <button type="button" onClick={onEdit} className="flex size-11 items-center justify-center text-foreground">
          <PencilIcon className="size-4" />
          <span className="sr-only">Edit caption</span>
        </button>
      </div>
    </li>
  )
}

export function PhotoManager({
  albumId,
  coverUrl,
  photos: initial,
}: {
  albumId: number
  coverUrl: string | null
  photos: Photo[]
}) {
  const router = useRouter()
  const [photos, setPhotos] = useState(initial)
  const [cover, setCover] = useState(coverUrl)
  const [selected, setSelected] = useState<number[]>([])
  const [editing, setEditing] = useState<Photo | null>(null)
  const [draft, setDraft] = useState({ alt: "", caption: "" })
  const [uploading, setUploading] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"))
    if (list.length === 0) {
      toast.error("Choose image files to upload.")
      return
    }
    setUploading(list.length)
    const uploaded: { url: string; alt: string }[] = []
    for (const file of list) {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.url) {
        uploaded.push({ url: json.url, alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") })
      } else {
        toast.error(`${file.name}: ${json.error ?? "Upload failed"}`)
      }
      setUploading((count) => count - 1)
    }
    if (uploaded.length > 0) {
      const result = await addPhotosAction(albumId, uploaded)
      if (result.ok) {
        toast.success(`Added ${result.data?.added ?? uploaded.length} photo${uploaded.length === 1 ? "" : "s"}`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const previous = photos
    const from = photos.findIndex((photo) => photo.id === active.id)
    const to = photos.findIndex((photo) => photo.id === over.id)
    const next = arrayMove(photos, from, to)
    setPhotos(next)
    startTransition(async () => {
      const result = await reorderPhotosAction(albumId, next.map((photo) => photo.id))
      if (!result.ok) {
        toast.error(result.error)
        setPhotos(previous)
      }
    })
  }

  function toggleSelect(id: number) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function makeCover(photo: Photo) {
    const next = cover === photo.url ? null : photo.url
    setCover(next)
    startTransition(async () => {
      const result = await setAlbumCoverAction(albumId, next)
      if (!result.ok) {
        toast.error(result.error)
        setCover(cover)
        return
      }
      toast.success(next ? "Cover updated" : "Cover cleared")
    })
  }

  function removeSelected() {
    const ids = selected
    startTransition(async () => {
      const result = await deletePhotosAction(albumId, ids)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setPhotos((current) => current.filter((photo) => !ids.includes(photo.id)))
      setSelected([])
      toast.success(`Removed ${result.data?.removed ?? ids.length} photo${ids.length === 1 ? "" : "s"}`)
    })
  }

  function openEdit(photo: Photo) {
    setEditing(photo)
    setDraft({ alt: photo.alt, caption: photo.caption })
  }

  function saveEdit() {
    if (!editing) return
    const target = editing
    startTransition(async () => {
      const result = await updatePhotoAction(target.id, draft)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setPhotos((current) => current.map((photo) => (photo.id === target.id ? { ...photo, ...draft } : photo)))
      setEditing(null)
      toast.success("Photo updated")
    })
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="photos-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="photos-heading" className="font-serif text-lg font-semibold text-foreground">
          Photos <span className="text-sm font-normal text-muted-foreground">({photos.length})</span>
        </h2>
        {selected.length > 0 ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-11" onClick={() => setSelected([])}>
              Clear
            </Button>
            <Button variant="destructive" className="h-11" disabled={pending} onClick={removeSelected}>
              <Trash2Icon className="size-4" />
              Remove {selected.length}
            </Button>
          </div>
        ) : null}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          if (event.dataTransfer.files.length) void upload(event.dataTransfer.files)
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <UploadIcon className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {uploading > 0 ? `Uploading ${uploading} more...` : "Drop images here or choose them from your device."}
        </p>
        <Button className="h-11" disabled={uploading > 0} onClick={() => inputRef.current?.click()}>
          Choose photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            if (event.target.files?.length) void upload(event.target.files)
            event.target.value = ""
          }}
        />
      </div>

      {photos.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">
            Drag the handle to reorder. Tap the star to choose the album cover.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={photos.map((photo) => photo.id)} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo) => (
                  <Tile
                    key={photo.id}
                    photo={photo}
                    isCover={cover === photo.url}
                    selected={selected.includes(photo.id)}
                    onSelect={() => toggleSelect(photo.id)}
                    onEdit={() => openEdit(photo)}
                    onCover={() => makeCover(photo)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      ) : null}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Photo details</DialogTitle>
            <DialogDescription>Alt text describes the photo for screen readers. The caption shows in the lightbox.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="photo-alt" className="text-sm font-medium text-foreground">
                Alt text
              </label>
              <Input
                id="photo-alt"
                value={draft.alt}
                onChange={(event) => setDraft((current) => ({ ...current, alt: event.target.value }))}
                className="h-11 text-base"
                maxLength={200}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="photo-caption" className="text-sm font-medium text-foreground">
                Caption
              </label>
              <Input
                id="photo-caption"
                value={draft.caption}
                onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))}
                className="h-11 text-base"
                maxLength={300}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-11" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button className="h-11" disabled={pending} onClick={saveEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
