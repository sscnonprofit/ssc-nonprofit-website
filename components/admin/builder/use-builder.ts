"use client"

import { useCallback, useReducer } from "react"

import { createSection } from "@/lib/builder/registry"
import { newId, type BuilderDoc, type Section } from "@/lib/builder/schema"

type State = { doc: BuilderDoc; past: BuilderDoc[]; future: BuilderDoc[]; selectedId: string | null }

type Action =
  | { type: "commit"; doc: BuilderDoc | ((doc: BuilderDoc) => BuilderDoc); select?: string | null }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "select"; id: string | null }
  | { type: "reset"; doc: BuilderDoc }

const HISTORY_LIMIT = 80

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "commit": {
      const next = typeof action.doc === "function" ? action.doc(state.doc) : action.doc
      const selectedId = action.select === undefined ? state.selectedId : action.select
      if (JSON.stringify(next) === JSON.stringify(state.doc)) return { ...state, selectedId }
      return {
        doc: next,
        past: [...state.past, state.doc].slice(-HISTORY_LIMIT),
        future: [],
        selectedId: next.sections.some((section) => section.id === selectedId) ? selectedId : null,
      }
    }
    case "undo": {
      const prev = state.past.at(-1)
      if (!prev) return state
      return { ...state, doc: prev, past: state.past.slice(0, -1), future: [state.doc, ...state.future], selectedId: prev.sections.some((section) => section.id === state.selectedId) ? state.selectedId : null }
    }
    case "redo": {
      const [next, ...rest] = state.future
      if (!next) return state
      return { ...state, doc: next, past: [...state.past, state.doc].slice(-HISTORY_LIMIT), future: rest, selectedId: next.sections.some((section) => section.id === state.selectedId) ? state.selectedId : null }
    }
    case "select":
      return { ...state, selectedId: action.id }
    case "reset":
      return { doc: action.doc, past: [], future: [], selectedId: null }
  }
}

/** Immutably sets `a.b.0.c` style paths inside section props. */
export function setPath(target: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const [head, ...rest] = path.split(".")
  const clone: Record<string, unknown> | unknown[] = Array.isArray(target) ? [...target] : { ...target }
  const key = Array.isArray(clone) ? Number(head) : head
  const current = (clone as Record<string | number, unknown>)[key]
  ;(clone as Record<string | number, unknown>)[key] = rest.length
    ? setPath((current ?? (/^\d+$/.test(rest[0]) ? [] : {})) as Record<string, unknown>, rest.join("."), value)
    : value
  return clone as Record<string, unknown>
}

export function useBuilder(initial: BuilderDoc) {
  const [state, dispatch] = useReducer(reducer, { doc: initial, past: [], future: [], selectedId: null })
  const { doc } = state

  const commit = useCallback((next: BuilderDoc | ((doc: BuilderDoc) => BuilderDoc), select?: string | null) => dispatch({ type: "commit", doc: next, select }), [])

  const updateSections = useCallback(
    (fn: (sections: Section[]) => Section[], select?: string | null) => commit((current) => ({ ...current, sections: fn(current.sections) }), select),
    [commit],
  )

  const updateSection = useCallback(
    (id: string, fn: (section: Section) => Section) => updateSections((list) => list.map((s) => (s.id === id ? fn(s) : s))),
    [updateSections],
  )

  const actions = {
    commit,
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    select: (id: string | null) => dispatch({ type: "select", id }),
    reset: (next: BuilderDoc) => dispatch({ type: "reset", doc: next }),
    setMeta: (patch: Partial<Pick<BuilderDoc, "title" | "seo">>) => commit((current) => ({ ...current, ...patch })),
    updateSection,
    setText: (id: string, path: string, value: string) =>
      updateSection(id, (s) => ({ ...s, props: setPath(s.props, path, value) })),
    insert: (type: string, index?: number) => {
      const section = createSection(type)
      updateSections((list) => {
        const at = index ?? list.length
        return [...list.slice(0, at), section, ...list.slice(at)]
      }, section.id)
      return section.id
    },
    insertSection: (section: Section, index?: number) => {
      const copy = { ...structuredClone(section), id: newId() }
      updateSections((list) => {
        const at = index ?? list.length
        return [...list.slice(0, at), copy, ...list.slice(at)]
      }, copy.id)
    },
    duplicate: (id: string) => {
      const copyId = newId()
      updateSections((list) => {
        const index = list.findIndex((section) => section.id === id)
        if (index < 0) return list
        const copy = { ...structuredClone(list[index]), id: copyId }
        return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)]
      }, copyId)
    },
    remove: (id: string) => updateSections((list) => list.filter((s) => s.id !== id), null),
    move: (id: string, delta: number) =>
      updateSections((list) => {
        const from = list.findIndex((s) => s.id === id)
        const to = from + delta
        if (from < 0 || to < 0 || to >= list.length) return list
        const next = [...list]
        const [item] = next.splice(from, 1)
        next.splice(to, 0, item)
        return next
      }),
    reorder: (fromId: string, toId: string) =>
      updateSections((list) => {
        const from = list.findIndex((s) => s.id === fromId)
        const to = list.findIndex((s) => s.id === toId)
        if (from < 0 || to < 0) return list
        const next = [...list]
        const [item] = next.splice(from, 1)
        next.splice(to, 0, item)
        return next
      }),
  }

  return {
    doc,
    selectedId: state.selectedId,
    selected: doc.sections.find((s) => s.id === state.selectedId) ?? null,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    ...actions,
  }
}

export type Builder = ReturnType<typeof useBuilder>
