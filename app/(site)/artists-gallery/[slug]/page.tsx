import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { PhotoGrid } from "@/components/gallery/photo-grid"
import { getPublicAlbum } from "@/lib/events/data"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicAlbum(slug)
  if (!result) return { title: "Album not found" }
  const cover = result.album.coverUrl ?? result.photos[0]?.url
  return {
    title: result.album.title,
    description: result.album.description || undefined,
    openGraph: { title: result.album.title, images: cover ? [cover] : undefined },
  }
}

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params
  const result = await getPublicAlbum(slug)
  if (!result) notFound()
  const { album, photos } = result

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 sm:py-16">
      <Link href="/artists-gallery#albums" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        All albums
      </Link>
      <header className="mb-8 flex max-w-3xl flex-col gap-3">
        <h1 className="text-balance font-display text-3xl font-semibold sm:text-5xl">{album.title}</h1>
        {album.description && <p className="text-pretty text-lg leading-relaxed text-muted-foreground">{album.description}</p>}
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </p>
      </header>
      {photos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Photos are coming soon.</p>
      ) : (
        <PhotoGrid
          title={album.title}
          photos={photos.map((photo) => ({ id: photo.id, url: photo.url, alt: photo.alt, caption: photo.caption }))}
        />
      )}
    </section>
  )
}
