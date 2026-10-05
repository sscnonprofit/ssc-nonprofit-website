"use client"

import { useEffect, useState, useTransition } from "react"
import { DownloadIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { deleteRsvpAction, listRsvpsAction, type RsvpSummary } from "@/app/admin/event-actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatEventDate } from "@/lib/events/occurrences"

export function RsvpDialog({
  event,
  canEdit,
  onClose,
}: {
  event: { id: number; title: string } | null
  canEdit: boolean
  onClose: () => void
}) {
  const [rsvps, setRsvps] = useState<RsvpSummary[] | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!event) return
    let cancelled = false
    setRsvps(null)
    listRsvpsAction(event.id).then((result) => {
      if (cancelled) return
      setRsvps(result.ok ? (result.data ?? []) : [])
      if (!result.ok) toast.error(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [event])

  const totalGuests = rsvps?.reduce((sum, row) => sum + row.guests, 0) ?? 0

  function remove(id: number) {
    if (!event) return
    startTransition(async () => {
      const result = await deleteRsvpAction(id, event.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setRsvps((current) => current?.filter((row) => row.id !== id) ?? null)
      toast.success("RSVP removed")
    })
  }

  return (
    <Dialog open={Boolean(event)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-balance">RSVPs for {event?.title}</DialogTitle>
          <DialogDescription>
            {rsvps === null ? "Loading..." : `${rsvps.length} sign-ups, ${totalGuests} guests in total.`}
          </DialogDescription>
        </DialogHeader>

        {event && rsvps && rsvps.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-11 w-fit"
            nativeButton={false}
            render={<a href={`/api/admin/events/${event.id}/rsvps`} download />}
          >
            <DownloadIcon className="size-4" />
            Download CSV
          </Button>
        )}

        <ul className="flex flex-col gap-2">
          {rsvps?.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0 text-sm">
                <p className="font-medium text-foreground">
                  {row.name} <span className="font-normal text-muted-foreground">({row.guests} {row.guests === 1 ? "guest" : "guests"})</span>
                </p>
                <p className="break-all text-muted-foreground">{row.email}</p>
                {row.phone && <p className="text-muted-foreground">{row.phone}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Attending {formatEventDate(new Date(row.occurrence), { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {row.note && <p className="mt-1 text-pretty text-muted-foreground">{row.note}</p>}
              </div>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 text-destructive"
                  disabled={pending}
                  onClick={() => remove(row.id)}
                >
                  <Trash2Icon className="size-4" />
                  <span className="sr-only">Remove RSVP from {row.name}</span>
                </Button>
              )}
            </li>
          ))}
          {rsvps?.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No one has signed up yet.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
