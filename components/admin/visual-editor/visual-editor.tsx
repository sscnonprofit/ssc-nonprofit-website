"use client"

import { ObjectFields } from "@/components/admin/visual-editor/object-fields"

/**
 * Renders any page's JSON content as an editable form, inferring field types
 * (text, textarea, number, boolean, image, sortable arrays, nested objects)
 * purely from the shape of the data. No per-page schema needed.
 */
export function VisualEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return <p className="text-sm text-muted-foreground">This page&apos;s content isn&apos;t a plain object and can&apos;t be edited visually. Use the JSON tab instead.</p>
  }

  if (Object.keys(content).length === 0) {
    return <p className="text-sm text-muted-foreground">This page has no content fields yet.</p>
  }

  return <ObjectFields data={content} onChange={onChange} />
}
