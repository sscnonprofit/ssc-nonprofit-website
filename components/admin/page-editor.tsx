"use client"

import { History, RotateCcw, Save, Send, Trash2 } from "lucide-react"
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
  route: string | null
  initialTitle: string
  initialContent: string
  status: string
  hasDraft: boolean
  canPublish: boolean
  revisions: Revision[]
}

export function PageEditor({
  slug,
  label,
  route,
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
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const validateJson = (value: string) => {
    try {
      JSON.parse(value)
      setJsonError(null)
      return true
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON")
      return false
    }
  }

  const handleSaveDraft = () => {
    if (!validateJson(content)) {
      toast.error("Fix the JSON before saving.")
      return
    }
    startTransition(async () => {
      try {
        await saveDraftAction(slug, title, content)
        toast.success("Draft saved.")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save draft.")
      }
    })
  }

  const handlePublish = () => {
    startTransition(async () => {
      try {
        await publishPageAction(slug)
        toast.success("Published to the live site.")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to publish.")
      }
    })
  }

  const handleDiscard = () => {
    startTransition(async () => {
      try {
        await discardDraftAction(slug)
        toast.success("Draft discarded.")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to discard draft.")
      }
    })
  }

  const handleRestore = (revisionId: number) => {
    startTransition(async () => {
      try {
        await restoreRevisionAction(slug, revisionId)
        toast.success("Revision restored to draft. Review and publish when ready.")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to restore revision.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">{label}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={status === "published" ? "default" : "secondary"} className="capitalize">
              {status}
            </Badge>
            {hasDraft && <Badge variant="outline">Draft pending review</Badge>}
            {route && <span className="text-sm text-muted-foreground">{route}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="history">
            <History data-icon="inline-start" />
            History ({revisions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Card>
            <CardContent className="pt-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="page-title">Title</FieldLabel>
                  <Input id="page-title" value={title} onChange={(e) => setTitle(e.target.value)} />
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
