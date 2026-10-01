"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  CheckIcon,
  CloudIcon,
  CopyIcon,
  EyeIcon,
  HistoryIcon,
  Loader2Icon,
  MonitorIcon,
  MoreHorizontalIcon,
  Redo2Icon,
  SmartphoneIcon,
  TabletIcon,
  Trash2Icon,
  TriangleAlertIcon,
  Undo2Icon,
  UploadCloudIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  deleteBuilderPageAction,
  duplicateBuilderPageAction,
  publishBuilderPageAction,
  saveBuilderDraftAction,
  unpublishBuilderPageAction,
} from "@/app/admin/builder-actions"
import { sanitizeDoc } from "@/lib/builder/registry"
import type { BuilderDoc } from "@/lib/builder/schema"
import { cn } from "@/lib/utils"

import { Canvas, type Device } from "./canvas"
import { Inspector } from "./inspector"
import { LeftPanel, type LeftTab } from "./left-panel"
import { useBuilder } from "./use-builder"

export type RevisionSummary = { id: number; note: string | null; createdAt: string; content: unknown }
type SaveState = "saved" | "pending" | "saving" | "error"

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return Boolean(el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)))
}

export function BuilderEditor({
  slug,
  initialDoc,
  status,
  hasDraft,
  isAdmin,
  themeVars,
  revisions,
}: {
  slug: string
  initialDoc: BuilderDoc
  status: string
  hasDraft: boolean
  isAdmin: boolean
  themeVars: Record<string, string>
  revisions: RevisionSummary[]
}) {
  const router = useRouter()
  const builder = useBuilder(initialDoc)
  const { doc } = builder
  const [device, setDevice] = useState<Device>("desktop")
  const [leftTab, setLeftTab] = useState<LeftTab>(initialDoc.sections.length ? "layers" : "add")
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [saveState, setSaveState] = useState<SaveState>("saved")
  const [unpublished, setUnpublished] = useState(hasDraft || status !== "published")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [busy, startTransition] = useTransition()
  const lastSaved = useRef(JSON.stringify(initialDoc))
  const latest = useRef(doc)
  latest.current = doc

  async function persist(snapshot = false, note?: string) {
    const json = JSON.stringify(latest.current)
    if (!snapshot && json === lastSaved.current) return true
    setSaveState("saving")
    try {
      const res = await saveBuilderDraftAction(slug, latest.current, { snapshot, note })
      if (!res.ok) throw new Error(res.error)
      lastSaved.current = json
      setUnpublished(true)
      setSaveState(JSON.stringify(latest.current) === json ? "saved" : "pending")
      return true
    } catch (error) {
      setSaveState("error")
      toast.error(error instanceof Error ? error.message : "Could not save")
      return false
    }
  }

  useEffect(() => {
    if (JSON.stringify(doc) === lastSaved.current) return
    setSaveState("pending")
    const timer = setTimeout(() => void persist(), 1200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc])

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(latest.current) !== lastSaved.current) e.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void persist(true, "Saved version").then((ok) => ok && (toast.success("Version saved"), router.refresh()))
        return
      }
      if (isTyping(e.target)) return
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) builder.redo()
        else builder.undo()
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault()
        builder.redo()
      } else if (mod && e.key.toLowerCase() === "d" && builder.selectedId) {
        e.preventDefault()
        builder.duplicate(builder.selectedId)
      } else if ((e.key === "Delete" || e.key === "Backspace") && builder.selectedId) {
        e.preventDefault()
        builder.remove(builder.selectedId)
      } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && builder.selectedId) {
        e.preventDefault()
        builder.move(builder.selectedId, e.key === "ArrowUp" ? -1 : 1)
      } else if (e.key === "Escape") {
        builder.select(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  function openInsert(index: number) {
    setInsertAt(index)
    setLeftTab("add")
  }

  function publish() {
    startTransition(async () => {
      const res = await publishBuilderPageAction(slug, latest.current)
      if (!res.ok) return void toast.error(res.error)
      lastSaved.current = JSON.stringify(latest.current)
      setSaveState("saved")
      setUnpublished(false)
      toast.success("Page published", { action: { label: "View", onClick: () => window.open(`/${slug}`, "_blank") } })
      router.refresh()
    })
  }

  function run(action: () => Promise<{ ok: boolean; error?: string; data?: { slug: string } }>, done: (data?: { slug: string }) => void) {
    startTransition(async () => {
      const res = await action()
      if (!res.ok) return void toast.error(res.error ?? "Something went wrong")
      done(res.data)
    })
  }

  const saveLabel = { saved: "Saved", pending: "Unsaved changes", saving: "Saving...", error: "Save failed" }[saveState]
  const SaveIcon = { saved: CheckIcon, pending: CloudIcon, saving: Loader2Icon, error: TriangleAlertIcon }[saveState]
  const devices = [
    { value: "desktop" as const, label: "Desktop", icon: MonitorIcon },
    { value: "tablet" as const, label: "Tablet", icon: TabletIcon },
    { value: "mobile" as const, label: "Mobile", icon: SmartphoneIcon },
  ]

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
        <Button variant="ghost" size="icon" className="size-8" render={<Link href="/admin" />}>
          <ArrowLeftIcon className="size-4" />
          <span className="sr-only">Back to pages</span>
        </Button>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{doc.title || "Untitled page"}</span>
          <span className="truncate font-mono text-[11px] text-muted-foreground">/{slug}</span>
        </div>
        <Badge variant={unpublished ? "secondary" : "default"} className="ml-1 hidden sm:inline-flex">
          {status !== "published" ? "Draft" : unpublished ? "Unpublished changes" : "Live"}
        </Badge>
        <span
          className={cn("ml-1 hidden items-center gap-1 text-xs text-muted-foreground md:flex", saveState === "error" && "text-destructive")}
          aria-live="polite"
        >
          <SaveIcon className={cn("size-3.5", saveState === "saving" && "animate-spin")} />
          {saveLabel}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8" disabled={!builder.canUndo} onClick={builder.undo} title="Undo (Ctrl+Z)">
            <Undo2Icon className="size-4" />
            <span className="sr-only">Undo</span>
          </Button>
          <Button variant="ghost" size="icon" className="size-8" disabled={!builder.canRedo} onClick={builder.redo} title="Redo (Ctrl+Shift+Z)">
            <Redo2Icon className="size-4" />
            <span className="sr-only">Redo</span>
          </Button>
          <div role="radiogroup" aria-label="Preview device" className="mx-1 hidden rounded-lg bg-muted p-0.5 sm:flex">
            {devices.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={device === value}
                title={label}
                onClick={() => setDevice(value)}
                className={cn("flex size-7 items-center justify-center rounded-md text-muted-foreground", device === value && "bg-background text-foreground shadow-sm")}
              >
                <Icon className="size-4" />
                <span className="sr-only">{label}</span>
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
            <HistoryIcon className="size-4" />
            <span className="hidden lg:inline">History</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const ok = await persist()
              if (ok) window.open(`/api/admin/preview?path=${encodeURIComponent(`/${slug}`)}`, "_blank", "noopener")
            }}
          >
            <EyeIcon className="size-4" />
            <span className="hidden lg:inline">Preview</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
              <MoreHorizontalIcon className="size-4" />
              <span className="sr-only">More page actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => void persist(true, "Saved version").then((ok) => ok && (toast.success("Version saved"), router.refresh()))}
                >
                  <CheckIcon className="size-4" />
                  Save version
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => run(() => duplicateBuilderPageAction(slug), (d) => d && router.push(`/admin/builder/${d.slug}`))}>
                  <CopyIcon className="size-4" />
                  Duplicate page
                </DropdownMenuItem>
              </DropdownMenuGroup>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {status === "published" && (
                      <DropdownMenuItem
                        onClick={() =>
                          run(
                            () => unpublishBuilderPageAction(slug),
                            () => {
                              toast.success("Page taken offline")
                              router.refresh()
                            },
                          )
                        }
                      >
                        <UploadCloudIcon className="size-4 rotate-180" />
                        Unpublish
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        if (!confirm(`Delete "${doc.title}"? This removes the page and its history.`)) return
                        run(
                          () => deleteBuilderPageAction(slug),
                          () => {
                            lastSaved.current = JSON.stringify(latest.current)
                            toast.success("Page deleted")
                            router.push("/admin")
                          },
                        )
                      }}
                    >
                      <Trash2Icon className="size-4" />
                      Delete page
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {isAdmin ? (
            <Button size="sm" onClick={publish} disabled={busy}>
              {busy ? <Loader2Icon className="size-4 animate-spin" /> : <UploadCloudIcon className="size-4" />}
              Publish
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled title="Only admins can publish">
              Publish (admin)
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-border lg:block" aria-label="Sections and page settings">
          <LeftPanel builder={builder} slug={slug} tab={leftTab} setTab={setLeftTab} insertAt={insertAt} setInsertAt={setInsertAt} />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto bg-muted/60" aria-label="Page canvas">
          <Canvas builder={builder} device={device} themeVars={themeVars} onInsert={openInsert} />
        </main>
        <aside className="hidden w-80 shrink-0 border-l border-border xl:block" aria-label="Section inspector">
          <Inspector builder={builder} />
        </aside>
      </div>

      <div className="border-t border-border bg-muted px-4 py-2 text-center text-xs text-muted-foreground lg:hidden">
        The page builder works best on a larger screen. You can still edit text directly on the canvas.
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Version history</DialogTitle>
            <DialogDescription>Restoring loads a version into the editor. You can undo it or publish when ready.</DialogDescription>
          </DialogHeader>
          {revisions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No saved versions yet. Press Ctrl+S to save one.</p>
          ) : (
            <ul className="flex max-h-96 flex-col divide-y divide-border overflow-y-auto">
              {revisions.map((rev) => (
                <li key={rev.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{rev.note || "Saved"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rev.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      builder.commit(sanitizeDoc(rev.content), null)
                      setHistoryOpen(false)
                      toast.success("Version restored to the editor")
                    }}
                  >
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
