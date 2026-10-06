"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, PlusIcon } from "lucide-react"

import { createBuilderPageAction } from "@/app/admin/builder-actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PAGE_TEMPLATES } from "@/lib/builder/registry"
import { slugify, validateSlug } from "@/lib/builder/schema"
import { cn } from "@/lib/utils"

export function CreatePageDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [template, setTemplate] = useState("landing")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const effectiveSlug = slugTouched ? slug : slugify(title)
  const slugError = effectiveSlug ? validateSlug(effectiveSlug) : null

  function reset() {
    setTitle("")
    setSlug("")
    setSlugTouched(false)
    setTemplate("landing")
    setError(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createBuilderPageAction({ title, slug: effectiveSlug, template })
      if (!res.ok) return setError(res.error)
      setOpen(false)
      reset()
      router.push(`/admin/builder/${res.data?.slug}`)
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Create page
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) reset()
        }}
      >
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)]">
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain p-4 sm:p-6">
            <DialogHeader className="pr-10">
              <DialogTitle className="text-lg leading-tight text-balance">Create a page</DialogTitle>
              <DialogDescription className="text-pretty">Pick a starting layout. You can add, remove, and restyle every section in the builder.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-title">Page name</Label>
                <Input id="new-title" value={title} maxLength={120} required autoFocus placeholder="e.g. Memory Care" className="h-11 text-base sm:text-sm" onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-slug">Web address</Label>
                <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50">
                  <span className="pl-3 font-mono text-sm text-muted-foreground">/</span>
                  <input
                    id="new-slug"
                    value={effectiveSlug}
                    inputMode="url"
                    maxLength={60}
                    aria-invalid={Boolean(slugError)}
                    aria-describedby="new-slug-hint"
                    onChange={(e) => {
                      setSlugTouched(true)
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                    }}
                    className="h-11 min-w-0 flex-1 bg-transparent pr-3 font-mono text-base outline-none sm:text-sm"
                  />
                </div>
                <span id="new-slug-hint" className={cn("text-xs", slugError ? "text-destructive" : "text-muted-foreground")}>
                  {slugError ?? "Lowercase letters, numbers, and dashes."}
                </span>
              </div>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">Starting layout</legend>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                {PAGE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={template === t.id}
                    onClick={() => setTemplate(t.id)}
                    className={cn(
                      "flex min-h-20 min-w-0 flex-col gap-1 rounded-md border border-border p-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      template === t.id && "border-primary bg-primary/5 ring-1 ring-primary",
                    )}
                  >
                    <span className="text-sm font-medium">{t.label}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{t.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter className="sticky bottom-0 m-0 shrink-0 flex-row gap-2 rounded-t-none border-t border-border bg-popover px-0 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-0 sm:py-0">
              <Button type="button" variant="outline" className="h-11 flex-1 sm:flex-none" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="h-11 flex-1 sm:flex-none" disabled={pending || !title.trim() || Boolean(slugError) || !effectiveSlug}>
                {pending && <Loader2Icon className="size-4 animate-spin" />}
                Create and open builder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
