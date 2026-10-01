"use client"

import { createContext, useContext, type ElementType, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type EditContextValue = { onText: (path: string, value: string) => void }

const EditContext = createContext<EditContextValue | null>(null)

export function EditProvider({ onText, children }: EditContextValue & { children: ReactNode }) {
  return <EditContext.Provider value={{ onText }}>{children}</EditContext.Provider>
}

function insertPlainText(event: React.ClipboardEvent<HTMLElement>) {
  event.preventDefault()
  const text = event.clipboardData.getData("text/plain")
  document.execCommand("insertText", false, text)
}

const editableClass =
  "cursor-text rounded-sm outline-none transition-shadow hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent)] focus:shadow-[0_0_0_2px_var(--primary)] empty:before:text-current/40 empty:before:content-[attr(data-placeholder)]"

/**
 * Text that renders normally on the public site and becomes click-to-edit
 * inside the builder canvas. Keyed by value so external edits remount the
 * node instead of fighting the browser's contentEditable DOM.
 */
export function Editable({
  path,
  value,
  as: Tag = "span",
  className,
  placeholder = "Add text",
  multiline = false,
}: {
  path: string
  value: string
  as?: ElementType
  className?: string
  placeholder?: string
  multiline?: boolean
}) {
  const ctx = useContext(EditContext)

  if (!ctx) {
    if (!value) return null
    return <Tag className={cn(multiline && "whitespace-pre-line", className)}>{value}</Tag>
  }

  return (
    <Tag
      key={value}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={multiline || undefined}
      aria-label={placeholder}
      data-placeholder={placeholder}
      spellCheck
      className={cn(editableClass, multiline && "whitespace-pre-line", className)}
      onPaste={insertPlainText}
      onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
        event.stopPropagation()
        if (event.key === "Escape" || (!multiline && event.key === "Enter")) {
          event.preventDefault()
          event.currentTarget.blur()
        }
      }}
      onBlur={(event: React.FocusEvent<HTMLElement>) => {
        const next = event.currentTarget.innerText.replace(/\n{3,}/g, "\n\n").trim()
        if (next !== value) ctx.onText(path, next)
      }}
    >
      {value}
    </Tag>
  )
}

/** Paragraph text: blank lines become separate paragraphs on the live site. */
export function RichText({ path, value, className }: { path: string; value: string; className?: string }) {
  const ctx = useContext(EditContext)
  if (ctx) {
    return <Editable path={path} value={value} as="div" multiline className={cn("ssc-prose", className)} placeholder="Add text" />
  }
  if (!value) return null
  const paragraphs = value.split(/\n\s*\n/).filter(Boolean)
  return (
    <div className={cn("ssc-prose", className)}>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

export function useIsEditing() {
  return useContext(EditContext) !== null
}
