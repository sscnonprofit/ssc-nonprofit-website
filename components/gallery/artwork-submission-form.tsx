"use client"

import { useState, useTransition } from "react"
import { submitArtworkAction } from "@/app/admin/exhibition-actions"
import { Button } from "@/components/ui/button"

export function ArtworkSubmissionForm({ exhibitionId }: { exhibitionId: number }) {
  const [pending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  function submit(formData: FormData) {
    setError("")
    const input = Object.fromEntries(formData.entries()) as Record<string, string>
    startTransition(async () => {
      const result = await submitArtworkAction({ exhibitionId, artistName: input.artistName ?? "", artistEmail: input.artistEmail ?? "", artistPhone: input.artistPhone, artistBio: input.artistBio, artistStatement: input.artistStatement, portfolioUrl: input.portfolioUrl, artworkTitle: input.artworkTitle ?? "", medium: input.medium, dimensions: input.dimensions, yearCreated: input.yearCreated ? Number(input.yearCreated) : undefined, askingPrice: input.askingPrice, notForSale: input.notForSale === "on", artworkDescription: input.artworkDescription })
      if (result.ok) setSent(true); else setError(result.error ?? "Unable to send submission.")
    })
  }
  if (sent) return <div className="mt-8 rounded-xl border border-primary/30 bg-primary/10 p-6"><h3 className="font-display text-xl font-semibold">Submission received</h3><p className="mt-2 text-sm text-muted-foreground">Thank you. Our curatorial team will review your artwork.</p></div>
  return <form action={submit} className="mt-8 grid gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-2"><Field label="Full name" name="artistName" required /><Field label="Email" name="artistEmail" type="email" required /><Field label="Phone" name="artistPhone" /><Field label="Portfolio URL" name="portfolioUrl" type="url" /><Field label="Artwork title" name="artworkTitle" required /><Field label="Medium" name="medium" /><Field label="Dimensions" name="dimensions" placeholder="H × W × D" /><Field label="Year created" name="yearCreated" type="number" /><label className="flex items-center gap-2 text-sm"><input name="notForSale" type="checkbox" /> Not for sale</label><label className="grid gap-2 text-sm md:col-span-2"><span>Artist statement</span><textarea name="artistStatement" rows={4} className="rounded-lg border border-input bg-background px-3 py-2" /></label><label className="grid gap-2 text-sm md:col-span-2"><span>Artwork description</span><textarea name="artworkDescription" rows={4} className="rounded-lg border border-input bg-background px-3 py-2" /></label>{error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}<Button disabled={pending} className="md:col-span-2">{pending ? "Sending…" : "Send submission"}</Button></form>
}
function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) { return <label className="grid gap-2 text-sm"><span>{label}</span><input name={name} type={type} required={required} placeholder={placeholder} className="h-10 rounded-lg border border-input bg-background px-3" /></label> }
