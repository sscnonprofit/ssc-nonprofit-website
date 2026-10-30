"use client";

import { useState } from "react";
import { ArrowUp, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, selectClass } from "./event-editor";
import { CalendarAppearanceControls } from "./calendar-appearance";
import type { Calendar, Location, Workspace } from "@/lib/calendars/model";
import type { CalendarAction } from "@/lib/calendars/service";

export function CalendarSettings({
  workspace,
  pending,
  run,
  onClose,
}: {
  workspace: Workspace;
  pending: boolean;
  run: (action: Omit<CalendarAction, "version">) => Promise<boolean>;
  onClose: () => void;
}) {
  const doc = workspace.document;
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  function field<K extends keyof Calendar>(key: K, value: Calendar[K]) {
    setCalendar((c) => (c ? { ...c, [key]: value } : c));
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl [&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
        <DialogHeader>
          <DialogTitle>Calendars & locations</DialogTitle>
          <DialogDescription>
            Each calendar has its own branding, editors and print defaults.
            Locations are shared.
          </DialogDescription>
        </DialogHeader>
        {calendar ? (
          <form
            className="flex flex-col gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run({ action: "calendar", data: calendar }))
                setCalendar(null);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="calendar-name">Calendar name</FieldLabel>
                <Input
                  id="calendar-name"
                  className="min-h-11 text-base"
                  required
                  value={calendar.name}
                  onChange={(e) => field("name", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="calendar-subtitle">Subtitle</FieldLabel>
                <Input
                  id="calendar-subtitle"
                  className="min-h-11 text-base"
                  value={calendar.subtitle}
                  onChange={(e) => field("subtitle", e.target.value)}
                />
              </Field>
              <CalendarAppearanceControls calendar={calendar} document={doc} onChange={setCalendar} />
              <Field>
                <FieldLabel htmlFor="calendar-visibility">
                  Visibility
                </FieldLabel>
                <select
                  id="calendar-visibility"
                  className={selectClass}
                  value={calendar.visibility}
                  onChange={(e) =>
                    field(
                      "visibility",
                      e.target.value as Calendar["visibility"],
                    )
                  }
                >
                  <option value="public">Public — published months only</option>
                  <option value="staff">Staff only</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="calendar-print">
                  Default print format
                </FieldLabel>
                <select
                  id="calendar-print"
                  className={selectClass}
                  value={calendar.printMode}
                  onChange={(e) =>
                    field("printMode", e.target.value as Calendar["printMode"])
                  }
                >
                  <option value="month">Monthly · landscape letter</option>
                  <option value="large">Large print · daily pages</option>
                  <option value="week">Weekly · one week per page</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="calendar-footer">Print footer</FieldLabel>
                <Textarea
                  id="calendar-footer"
                  className="text-base"
                  value={calendar.footer}
                  onChange={(e) => field("footer", e.target.value)}
                />
              </Field>
              <FieldSet>
                <FieldLegend>Enabled locations</FieldLegend>
                {doc.locations.map((l) => (
                  <Check
                    key={l.id}
                    label={`${l.code} — ${l.name}`}
                    checked={calendar.locationIds.includes(l.id)}
                    onChange={(v) =>
                      field(
                        "locationIds",
                        v
                          ? [...calendar.locationIds, l.id]
                          : calendar.locationIds.filter((id) => id !== l.id),
                      )
                    }
                  />
                ))}
              </FieldSet>
              <FieldSet>
                <FieldLegend>Assigned calendar editors</FieldLegend>
                <p className="text-sm text-muted-foreground">
                  Admins always have access. Only users with the editor role can
                  use these assignments.
                </p>
                {workspace.staff.map((s) => (
                  <Check
                    key={s.id}
                    label={s.name}
                    checked={calendar.editorIds.includes(s.id)}
                    onChange={(v) =>
                      field(
                        "editorIds",
                        v
                          ? [...calendar.editorIds, s.id]
                          : calendar.editorIds.filter((id) => id !== s.id),
                      )
                    }
                  />
                ))}
              </FieldSet>
              <Check
                label="Show day notes"
                checked={calendar.showNotes}
                onChange={(v) => field("showNotes", v)}
              />
              <Check
                label="Include US federal holidays"
                checked={calendar.holidays}
                onChange={(v) => field("holidays", v)}
              />
              <Check
                label="Archived (hidden publicly)"
                checked={calendar.archived}
                onChange={(v) => field("archived", v)}
              />
            </FieldGroup>
            <div className="flex gap-2">
              <Button className="min-h-11" disabled={pending}>
                Save settings
              </Button>
              <Button
                type="button"
                className="min-h-11"
                variant="outline"
                onClick={() => setCalendar(null)}
              >
                Back
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            <section className="flex flex-col gap-3">
              <h3 className="font-semibold">Calendars</h3>
              {[...doc.calendars]
                .sort((a, b) => a.order - b.order)
                .map((c, index, list) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3"
                  >
                    <Button
                      variant="ghost"
                      className="min-h-11 h-auto flex-1 whitespace-normal text-left"
                      onClick={() => setCalendar(c)}
                    >
                      {c.name}
                      {c.archived ? " (archived)" : ""}
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-11 min-w-11"
                      size="icon"
                      aria-label={`Clone ${c.name}`}
                      disabled={pending}
                      onClick={() => run({ action: "clone", calendarId: c.id })}
                    >
                      <Copy />
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-11 min-w-11"
                      size="icon"
                      disabled={!index || pending}
                      aria-label={`Move ${c.name} earlier`}
                      onClick={() => {
                        const ids = list.map((v) => v.id);
                        [ids[index - 1], ids[index]] = [
                          ids[index],
                          ids[index - 1],
                        ];
                        run({ action: "reorder", data: ids });
                      }}
                    >
                      <ArrowUp />
                    </Button>
                  </div>
                ))}
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() =>
                  setCalendar({
                    id: "",
                    name: "",
                    subtitle: "",
                    color: "wine",
                    theme: "classic",
                    font: "sans",
                    visibility: "staff",
                    locationIds: [],
                    footer: "Activities subject to change.",
                    editorIds: [],
                    archived: false,
                    order: doc.calendars.length,
                    showNotes: true,
                    holidays: true,
                    printMode: "month",
                  })
                }
              >
                <Plus data-icon="inline-start" />
                New calendar
              </Button>
            </section>
            <section className="flex flex-col gap-3 border-t border-border pt-4">
              <h3 className="font-semibold">Master location list</h3>
              {doc.locations.map((l) => (
                <Button
                  key={l.id}
                  variant="ghost"
                  className="min-h-11 h-auto justify-start whitespace-normal text-left"
                  onClick={() => setLocation(l)}
                >
                  {l.code} — {l.name}
                </Button>
              ))}
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() =>
                  setLocation({ id: "", code: "", name: "", note: "" })
                }
              >
                Add location
              </Button>
              {location && (
                <form
                  className="flex flex-col gap-3 rounded-lg border border-border p-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await run({ action: "location", data: location }))
                      setLocation(null);
                  }}
                >
                  <FieldGroup>
                    {(["name", "code", "note"] as const).map((key) => (
                      <Field key={key}>
                        <FieldLabel htmlFor={`location-${key}`}>
                          {
                            {
                              name: "Full name",
                              code: "Short code",
                              note: "Optional note",
                            }[key]
                          }
                        </FieldLabel>
                        <Input
                          id={`location-${key}`}
                          className="min-h-11 text-base"
                          required={key !== "note"}
                          value={location[key]}
                          onChange={(e) =>
                            setLocation({ ...location, [key]: e.target.value })
                          }
                        />
                      </Field>
                    ))}
                  </FieldGroup>
                  <Button className="min-h-11" disabled={pending}>
                    Save location
                  </Button>
                </form>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
