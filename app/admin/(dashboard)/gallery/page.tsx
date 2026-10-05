import type { Metadata } from "next"

import { AlbumsManager } from "@/components/admin/gallery/albums-manager"
import { getSessionUser } from "@/lib/cms/auth-helpers"
import { listAdminAlbums } from "@/lib/events/data"

export const metadata: Metadata = { title: "Gallery" }
export const dynamic = "force-dynamic"

export default async function AdminGalleryPage() {
  const [user, albums] = await Promise.all([getSessionUser(), listAdminAlbums()])
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Gallery</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Group photos into albums, choose covers, reorder them and publish when they are ready.
        </p>
      </div>
      <AlbumsManager albums={albums} role={user?.role ?? "viewer"} />
    </div>
  )
}
