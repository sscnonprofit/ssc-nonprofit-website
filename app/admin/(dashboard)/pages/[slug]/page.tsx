import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { PageEditor } from "@/components/admin/page-editor"
import { auth } from "@/lib/auth"
import { getPageRow, listRevisions } from "@/lib/cms/pages"
import { getCmsDoc } from "@/lib/cms/registry"

export default async function AdminPageEditorRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = getCmsDoc(slug)
  if (!doc) notFound()

  const [row, revisions, session] = await Promise.all([
    getPageRow(slug),
    listRevisions(slug),
    auth.api.getSession({ headers: await headers() }),
  ])

  const role = (session?.user as { role?: string } | undefined)?.role ?? "editor"
  const activeContent = row?.draftContent ?? row?.content ?? {}

  return (
    <PageEditor
      slug={slug}
      label={doc.label}
      route={doc.route}
      initialTitle={row?.title ?? doc.label}
      initialContent={JSON.stringify(activeContent, null, 2)}
      status={row?.status ?? "draft"}
      hasDraft={Boolean(row?.draftContent)}
      canPublish={role === "admin"}
      revisions={revisions}
    />
  )
}
