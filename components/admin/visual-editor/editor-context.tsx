"use client"

import { createContext, useContext } from "react"

/** The editor's current search text. Nested fields read it to hide anything that does not match. */
export const EditorQueryContext = createContext("")

export function useEditorQuery() {
  return useContext(EditorQueryContext)
}
