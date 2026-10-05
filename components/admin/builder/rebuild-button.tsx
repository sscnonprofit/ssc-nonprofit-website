"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LayoutTemplateIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { convertTemplatePageAction } from "@/app/admin/builder-actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function RebuildButton({ slug, label }: { slug: string; label: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function rebuild() {
    startTransition(async () => {
      const res = await convertTemplatePageAction(slug)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Builder copy of ${label} created`)
      router.push(`/admin/builder/${res.data?.slug}`)
    })
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)} className="h-11 sm:h-8">
        <LayoutTemplateIcon data-icon="inline-start" />
        Rebuild in builder
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rebuild {label} in the builder?</DialogTitle>
            <DialogDescription>
              This creates a new draft page with sections filled from the current content. The original page stays live and
              unchanged until you publish the copy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending} className="h-11 sm:h-9">
              Cancel
            </Button>
            <Button type="button" onClick={rebuild} disabled={pending} className="h-11 sm:h-9">
              {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              Create builder copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
