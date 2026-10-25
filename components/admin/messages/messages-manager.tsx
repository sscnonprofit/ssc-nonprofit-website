"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, MailIcon, PhoneIcon, Trash2Icon, UndoIcon } from "lucide-react"
import { toast } from "sonner"

import { deleteMessageAction, setMessageStatusAction } from "@/app/admin/message-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type AdminMessage = {
  id: number
  kind: string
  name: string
  email: string
  phone: string
  topic: string
  message: string
  status: string
  createdAt: string
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "handled", label: "Handled" },
] as const

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
}

export function MessagesManager({ messages, canDelete }: { messages: AdminMessage[]; canDelete: boolean }) {
  const router = useRouter()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all")
  const [pending, startTransition] = useTransition()

  const counts = useMemo(
    () => ({
      all: messages.length,
      new: messages.filter((m) => m.status === "new").length,
      handled: messages.filter((m) => m.status === "handled").length,
    }),
    [messages],
  )

  const visible = filter === "all" ? messages : messages.filter((m) => m.status === filter)

  function setStatus(id: number, status: string) {
    startTransition(async () => {
      const result = await setMessageStatusAction(id, status)
      if (!result.ok) toast.error(result.error)
      else router.refresh()
    })
  }

  function remove(id: number) {
    if (!window.confirm("Delete this message permanently?")) return
    startTransition(async () => {
      const result = await deleteMessageAction(id)
      if (!result.ok) toast.error(result.error)
      else {
        toast.success("Message deleted")
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter messages">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            size="sm"
            variant={filter === item.id ? "default" : "outline"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
            <span className="ml-1.5 tabular-nums opacity-80">{counts[item.id]}</span>
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {messages.length === 0
            ? "No messages yet. Submissions from the contact form and newsletter signup will appear here."
            : "No messages match this filter."}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((m) => (
            <li key={m.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-foreground">{m.name || m.email}</h2>
                    <Badge variant={m.status === "new" ? "default" : "secondary"}>{m.status === "new" ? "New" : "Handled"}</Badge>
                    <Badge variant="outline">{m.kind === "newsletter" ? "Newsletter" : "Contact"}</Badge>
                    {m.topic && m.kind !== "newsletter" ? <Badge variant="outline">{m.topic}</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(m.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.status === "new" ? (
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setStatus(m.id, "handled")}>
                      <CheckIcon className="size-4" aria-hidden="true" /> Mark handled
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setStatus(m.id, "new")}>
                      <UndoIcon className="size-4" aria-hidden="true" /> Mark new
                    </Button>
                  )}
                  {canDelete ? (
                    <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => remove(m.id)} aria-label={`Delete message from ${m.name || m.email}`}>
                      <Trash2Icon className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>

              {m.message ? <p className="mt-3 whitespace-pre-wrap text-pretty text-sm leading-relaxed text-foreground">{m.message}</p> : null}

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <MailIcon className="size-4" aria-hidden="true" /> {m.email}
                </a>
                {m.phone ? (
                  <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <PhoneIcon className="size-4" aria-hidden="true" /> {m.phone}
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
