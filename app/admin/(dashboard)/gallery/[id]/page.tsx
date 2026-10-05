import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"

import { AlbumDetailsForm } from "@/components/admin/gallery/album-details-form"
import { PhotoManager } from "@/components/admin/gallery/photo-manager"
import { getSessionUser } from "@/lib/cms/auth-helpers"
import { getAlbumById, listAdminEvents, listAlbumPhotos } from "@/lib/events/data"

export const metadata: Metadata = { title: "Edit album" }
export const dynamic = "force-dynamic"

export default async function AdminAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const albumId = Number(id)
  if (!Number.isInteger(albumId)) notFound()

  const [user, album, photos, events] = await Promise.all([
    getSessionUser(),
    getAlbumById(albumId),
    listAlbumPhotos(albumId),
    listAdminEvents(),
  ])
  if (!album) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/gallery"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          All albums
        </Link>
        {album.status === "published" ? (
          <Link
            href={`/gallery/${album.slug}`}
            target="_blank"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View on site
            <ExternalLinkIcon className="size-4" />
          </Link>
        ) : null}
      </div>

      <AlbumDetailsForm
        role={user?.role ?? "viewer"}
        album={{
          id: album.id,
          title: album.title,
          slug: album.slug,
          description: album.description,
          status: album.status,
          featured: album.featured,
          eventId: album.eventId,
        }}
        events={events.map((event) => ({ id: event.id, title: event.title }))}
      />

      <PhotoManager
        key={photos.map((photo) => `${photo.id}:${photo.alt}:${photo.caption}`).join("|") + `#${album.coverUrl ?? ""}`}
        albumId={album.id}
        coverUrl={album.coverUrl}
        photos={photos.map((photo) => ({ id: photo.id, url: photo.url, alt: photo.alt, caption: photo.caption }))}
      />
    </div>
  )
}
