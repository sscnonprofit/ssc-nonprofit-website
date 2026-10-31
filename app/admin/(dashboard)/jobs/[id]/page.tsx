import { redirect } from "next/navigation"

export default async function JobEditorRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/admin/jobs?edit=${encodeURIComponent(id)}`)
}
