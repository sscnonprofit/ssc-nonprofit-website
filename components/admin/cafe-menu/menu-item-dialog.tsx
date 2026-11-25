"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DIETARY_TAGS, validateMenuItem, type CafeMenuItem } from "@/lib/cafe/menu"

export function MenuItemDialog({ item: initial, sectionName, isNew, onClose, onSave }: {
  item: CafeMenuItem; sectionName: string; isNew: boolean; onClose: () => void; onSave: (item: CafeMenuItem) => void
}) {
  const [item, setItem] = useState(initial)
  const [error, setError] = useState("")
  const update = (patch: Partial<CafeMenuItem>) => { setItem((current) => ({ ...current, ...patch })); setError("") }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try { onSave(validateMenuItem(item)) }
    catch (err) { setError(err instanceof Error ? err.message : "Check the item details.") }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isNew ? `Add item to ${sectionName}` : "Edit menu item"}</DialogTitle>
          <DialogDescription>Changes stay in your editor until you save a draft or publish.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="item-name">Item name</FieldLabel>
              <Input id="item-name" value={item.name} onChange={(e) => update({ name: e.target.value })} maxLength={120} required autoFocus />
            </Field>
            <Field>
              <FieldLabel htmlFor="item-description">Description</FieldLabel>
              <Textarea id="item-description" value={item.description} onChange={(e) => update({ description: e.target.value })} maxLength={400} placeholder="Optional. Ingredients, sides or serving size." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
              <Field>
                <FieldLabel htmlFor="item-price">Price</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground" aria-hidden="true">$</span>
                  <Input id="item-price" inputMode="decimal" className="pl-7" value={item.price} onChange={(e) => update({ price: e.target.value })} maxLength={12} placeholder="4.50" />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="item-price-note">Price note</FieldLabel>
                <Input id="item-price-note" value={item.priceNote} onChange={(e) => update({ priceNote: e.target.value })} maxLength={60} placeholder="e.g. per scoop · Large $3.50" />
              </Field>
            </div>
            <FieldDescription className="-mt-3">Leave the price blank if the item has no set price.</FieldDescription>
            <FieldSet>
              <FieldLegend variant="label">Dietary labels</FieldLegend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DIETARY_TAGS.map((tag) => {
                  const id = `item-tag-${tag.replace(/\W+/g, "-").toLowerCase()}`
                  return <Field key={tag} orientation="horizontal">
                    <input id={id} type="checkbox" className="size-4 accent-primary" checked={item.tags.includes(tag)}
                      onChange={(e) => update({ tags: e.target.checked ? [...item.tags, tag] : item.tags.filter((t) => t !== tag) })} />
                    <FieldLabel htmlFor={id} className="font-normal">{tag}</FieldLabel>
                  </Field>
                })}
              </div>
            </FieldSet>
            <Field orientation="horizontal">
              <input id="item-featured" type="checkbox" className="size-4 accent-primary" checked={item.featured} onChange={(e) => update({ featured: e.target.checked })} />
              <FieldLabel htmlFor="item-featured">Highlight as a special</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <input id="item-available" type="checkbox" className="size-4 accent-primary" checked={item.available} onChange={(e) => update({ available: e.target.checked })} />
              <FieldLabel htmlFor="item-available">Available now</FieldLabel>
            </Field>
            <FieldDescription className="-mt-3">Unavailable items stay on the menu, marked &ldquo;Not available today&rdquo;.</FieldDescription>
            <Field orientation="horizontal">
              <input id="item-visible" type="checkbox" className="size-4 accent-primary" checked={item.visible} onChange={(e) => update({ visible: e.target.checked })} />
              <FieldLabel htmlFor="item-visible">Show on the website</FieldLabel>
            </Field>
          </FieldGroup>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isNew ? "Add to menu" : "Apply changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
