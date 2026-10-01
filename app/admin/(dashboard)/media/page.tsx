import type { Metadata } from "next"

import { MediaGrid } from "@/components/admin/media/media-grid"
import { getSessionUser } from "@/lib/cms/auth-helpers"

export const metadata: Metadata = { title: "Media library" }

export default async function MediaPage() {
  const user = await getSessionUser()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Media</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every image uploaded for the site. Drop files anywhere below to upload.
          {user?.role !== "admin" && " Only admins can delete images."}
        </p>
      </div>
      <MediaGrid canDelete={user?.role === "admin"} />
    </div>
  )
}
