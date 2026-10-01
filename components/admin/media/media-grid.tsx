"use client"

import { useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"
import { CheckIcon, CopyIcon, ImagesIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type MediaItem = { url: string; pathname: string; size: number; uploadedAt: string }
type Page = { items: MediaItem[]; cursor: string | null }

const fetcher = async (url: string): Promise<Page> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Could not load media")
  return res.json()
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function useMedia() {
  return useSWRInfinite<Page>(
    (index, prev) => (index === 0 ? "/api/admin/media" : prev?.cursor ? `/api/admin/media?cursor=${encodeURIComponent(prev.cursor)}` : null),
    fetcher,
    { revalidateOnFocus: false },
  )
}

/** Shared library grid used by the Media page and the builder's image picker. */
export function MediaGrid({
  onPick,
  selectedUrl,
  canDelete = false,
}: {
  onPick?: (url: string) => void
  selectedUrl?: string
  canDelete?: boolean
}) {
  const { data, error, isLoading, size, setSize, mutate } = useMedia()
  const items = data?.flatMap((p) => p.items) ?? []
  const hasMore = Boolean(data?.at(-1)?.cursor)
  const [query, setQuery] = useState("")
  const [uploading, setUploading] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(files: FileList | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"))
    if (!list.length) return
    setUploading(list.length)
    let firstUrl: string | null = null
    for (const file of list) {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body })
      const json = await res.json().catch(() => ({}))
      if (res.ok) firstUrl ??= json.url
      else toast.error(`${file.name}: ${json.error ?? "Upload failed"}`)
      setUploading((n) => n - 1)
    }
    await mutate()
    if (firstUrl) toast.success(list.length > 1 ? `${list.length} images uploaded` : "Image uploaded")
  }

  async function remove(url: string) {
    if (!confirm("Delete this image? Pages that use it will show a blank image.")) return
    const res = await fetch("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) })
    if (!res.ok) return toast.error("Could not delete image")
    toast.success("Image deleted")
    mutate()
  }

  const filtered = query ? items.filter((i) => i.pathname.toLowerCase().includes(query.toLowerCase())) : items

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by file name" className="h-9 max-w-xs" aria-label="Filter media" />
        <Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading > 0} className="ml-auto">
          {uploading > 0 ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
          {uploading > 0 ? `Uploading ${uploading}...` : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            upload(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      <div
        className="min-h-48 rounded-xl border-2 border-dashed border-transparent transition-colors data-[drag=true]:border-primary"
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.dataset.drag = "true"
        }}
        onDragLeave={(e) => (e.currentTarget.dataset.drag = "false")}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.dataset.drag = "false"
          upload(e.dataTransfer.files)
        }}
      >
        {error ? (
          <p className="p-6 text-sm text-destructive">Could not load the media library.</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center text-muted-foreground">
            <ImagesIcon className="size-8" />
            <p className="text-sm font-medium text-foreground">{query ? "No matching images" : "No images yet"}</p>
            <p className="text-xs">Drop images here or use Upload.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((item) => {
              const selected = item.url === selectedUrl
              return (
                <li key={item.url} className={cn("group relative overflow-hidden rounded-lg border border-border bg-muted", selected && "ring-2 ring-primary")}>
                  <button
                    type="button"
                    onClick={() => onPick?.(item.url)}
                    disabled={!onPick}
                    className="block aspect-square w-full disabled:cursor-default"
                    aria-label={onPick ? `Use ${item.pathname}` : item.pathname}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt="" loading="lazy" className="size-full object-cover" />
                  </button>
                  {selected && (
                    <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="size-3.5" />
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-1 border-t border-border bg-card px-2 py-1.5">
                    <span className="truncate text-[11px] text-muted-foreground">{formatSize(item.size)}</span>
                    <span className="flex gap-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-6"
                        onClick={() => navigator.clipboard.writeText(item.url).then(() => toast.success("Link copied"))}
                      >
                        <CopyIcon className="size-3" />
                        <span className="sr-only">Copy link</span>
                      </Button>
                      {canDelete && (
                        <Button type="button" size="icon" variant="ghost" className="size-6 text-destructive" onClick={() => remove(item.url)}>
                          <Trash2Icon className="size-3" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {hasMore && (
        <Button type="button" variant="outline" size="sm" className="self-center" onClick={() => setSize(size + 1)}>
          Load more
        </Button>
      )}
    </div>
  )
}
