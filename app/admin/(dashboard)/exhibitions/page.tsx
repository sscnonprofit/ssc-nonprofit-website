import type { Metadata } from "next"

import { ExhibitionsManager } from "@/components/admin/exhibitions/exhibitions-manager"
import { getSessionUser } from "@/lib/cms/auth-helpers"
import { listAdminExhibitions, listAlbumOptions } from "@/lib/gallery/exhibitions"

export const metadata: Metadata = { title: "Exhibitions" }
export const dynamic = "force-dynamic"

export default async function ExhibitionsAdminPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const [user, exhibitions, albums, params] = await Promise.all([getSessionUser(), listAdminExhibitions(), listAlbumOptions(), searchParams])
  const editId = Number(params.edit)
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Exhibitions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curate Artists Gallery exhibitions, link artwork albums, run open calls and review artist submissions.
        </p>
      </div>
      <ExhibitionsManager
        exhibitions={exhibitions}
        albums={albums}
        role={user?.role ?? "viewer"}
        initialEditId={Number.isInteger(editId) && editId > 0 ? editId : null}
      />
    </div>
  )
}
