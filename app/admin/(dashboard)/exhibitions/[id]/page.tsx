import { redirect } from "next/navigation"

export default async function ExhibitionEditorRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/admin/exhibitions?edit=${encodeURIComponent(id)}`)
}
