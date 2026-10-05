import Link from "next/link"
import { redirect } from "next/navigation"

import { createExhibitionAction } from "@/app/admin/exhibition-actions"
import { Button } from "@/components/ui/button"
import { listAdminExhibitions } from "@/lib/gallery/exhibitions"
import { requireEditor } from "@/lib/cms/auth-helpers"

export default async function ExhibitionsAdminPage() {
  await requireEditor()
  const exhibitions = await listAdminExhibitions()
  async function create(formData: FormData) {
    "use server"
    const result = await createExhibitionAction({ title: String(formData.get("title") ?? "") })
    if (result.ok) redirect(`/admin/exhibitions/${result.id}`)
  }
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Gallery management</p><h1 className="mt-2 font-display text-3xl font-semibold">Exhibitions</h1><p className="mt-2 text-muted-foreground">Create curated exhibitions without changing existing albums.</p></div><form action={create} className="flex gap-2"><input name="title" required placeholder="New exhibition title" className="h-10 min-w-0 rounded-lg border border-input bg-background px-3" /><Button type="submit">Create</Button></form></div><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{exhibitions.map((exhibition) => <Link href={`/admin/exhibitions/${exhibition.id}`} key={exhibition.id} className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-md"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs uppercase tracking-wider text-primary">{exhibition.status}</span>{exhibition.featured && <span className="text-xs text-muted-foreground">Featured</span>}</div><h2 className="mt-3 font-display text-xl font-semibold">{exhibition.title}</h2><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{exhibition.description || "No description yet."}</p></Link>)}</div></main>
}
