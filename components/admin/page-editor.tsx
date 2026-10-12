"use client"

import { CodeIcon, History, LayoutPanelLeftIcon, RotateCcw, Save, Send, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  discardDraftAction,
  publishPageAction,
  restoreRevisionAction,
  saveDraftAction,
} from "@/app/admin/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { VisualEditor } from "@/components/admin/visual-editor/visual-editor"
import { LeadershipEditor } from "@/components/admin/leadership-editor"
import { buttonVariants } from "@/components/ui/button"

type Revision = {
  id: number
  title: string
  editedBy: string | null
  note: string | null
  createdAt: Date
}

type PageEditorProps = {
  slug: string
  label: string
  routes: string[]
  initialTitle: string
  initialContent: string
  status: string
  hasDraft: boolean
  canPublish: boolean
  revisions: Revision[]
}

function tryParseObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function PageEditor({
  slug,
  label,
  routes,
  initialTitle,
  initialContent,
  status,
  hasDraft,
  canPublish,
  revisions,
}: PageEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [contentObj, setContentObj] = useState<Record<string, unknown> | null>(() => tryParseObject(initialContent))
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const validateJson = (value: string) => {
    try {
      const parsed = JSON.parse(value)
      setJsonError(null)
      setContentObj(parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null)
      return true
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON")
      return false
    }
  }

  function handleVisualChange(next: Record<string, unknown>) {
    setContentObj(next)
    setContent(JSON.stringify(next, null, 2))
    setJsonError(null)
  }

  const handleSaveDraft = () => {
    if (!validateJson(content)) {
      toast.error("Fix the JSON before saving.")
      return
    }
    startTransition(async () => {
      const result = await saveDraftAction(slug, title, content)
      if (result.success) {
        toast.success("Draft saved.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handlePublish = () => {
    // Publish must carry over whatever is currently in the editor, not just
    // whatever draft happens to already be saved in the database — otherwise
    // an edit (e.g. deleting a team member) made right before clicking
    // Publish gets silently dropped and the live site stays on stale content.
    if (!validateJson(content)) {
      toast.error("Fix the JSON before publishing.")
      return
    }
    startTransition(async () => {
      const saveResult = await saveDraftAction(slug, title, content)
      if (!saveResult.success) {
        toast.error(saveResult.error)
        return
      }
      const result = await publishPageAction(slug)
      if (result.success) {
        toast.success("Published to the live site.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDiscard = () => {
    startTransition(async () => {
      const result = await discardDraftAction(slug)
      if (result.success) {
        toast.success("Draft discarded.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleRestore = (revisionId: number) => {
    startTransition(async () => {
      const result = await restoreRevisionAction(slug, revisionId)
      if (result.success) {
        toast.success("Revision restored to draft. Review and publish when ready.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div key={slug} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">{label}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge variant={status === "published" ? "default" : "secondary"} className="capitalize">
              {status}
            </Badge>
            {hasDraft && <Badge variant="outline">Draft pending review</Badge>}
            {routes.length > 0 && (
              <span className="text-sm text-muted-foreground">{routes.join(", ")}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {slug === "leadership" && <a href="/api/admin/preview?path=/leadership" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>Preview saved draft</a>}
          {hasDraft && (
            <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={pending}>
              <Trash2 data-icon="inline-start" />
              Discard draft
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={pending}>
            <Save data-icon="inline-start" />
            Save draft
          </Button>
          {canPublish ? (
            <Button size="sm" onClick={handlePublish} disabled={pending}>
              <Send data-icon="inline-start" />
              Publish
            </Button>
          ) : (
            <Badge variant="outline">Ask an admin to publish</Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="visual">
        <TabsList>
          <TabsTrigger value="visual">
            <LayoutPanelLeftIcon data-icon="inline-start" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="json">
            <CodeIcon data-icon="inline-start" />
            JSON
          </TabsTrigger>
          <TabsTrigger value="history">
            <History data-icon="inline-start" />
            History ({revisions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual">
          <Card>
            <CardContent className="pt-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="page-title">Title</FieldLabel>
                  <Input id="page-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
              </FieldGroup>
              <div className="mt-5">
                {contentObj ? (
                  slug === "leadership" ? <LeadershipEditor content={contentObj} onChange={handleVisualChange} /> : <VisualEditor content={contentObj} onChange={handleVisualChange} />
                ) : (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                    This page&apos;s content couldn&apos;t be parsed as an object. Use the JSON tab to fix it.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json">
          <Card>
            <CardContent className="pt-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="page-title-json">Title</FieldLabel>
                  <Input id="page-title-json" value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
                <Field data-invalid={Boolean(jsonError)}>
                  <FieldLabel htmlFor="page-content">Content (JSON)</FieldLabel>
                  <Textarea
                    id="page-content"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value)
                      validateJson(e.target.value)
                    }}
                    aria-invalid={Boolean(jsonError)}
                    className="min-h-[480px] font-mono text-sm"
                    spellCheck={false}
                  />
                  {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revision history</CardTitle>
            </CardHeader>
            <CardContent>
              {revisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No revisions yet. Save a draft to create one.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {revisions.map((revision) => (
                    <li
                      key={revision.id}
                      className="flex items-center justify-between gap-4 rounded-md border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{revision.note || "Draft saved"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(revision.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRestore(revision.id)} disabled={pending}>
                        <RotateCcw data-icon="inline-start" />
                        Restore
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
