"use client";

import { useState } from "react";
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
import {
  CATEGORIES,
  type CalendarDocument,
  type CalendarEvent,
  type Series,
} from "@/lib/calendars/model";

export const selectClass =
  "min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground";
export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-base">
      <input
        type="checkbox"
        className="size-5 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
export function EventEditor({
  event,
  document: doc,
  pending,
  onSave,
  onDelete,
  onClose,
}: {
  event: CalendarEvent;
  document: CalendarDocument;
  pending: boolean;
  onSave: (
    event: CalendarEvent & { recurrence?: object },
    scope: string,
  ) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(event);
  const series = doc.series.find((s) => s.id === event.seriesId);
  const [repeat, setRepeat] = useState(series ? series.rule : "none");
  const [scope, setScope] = useState("one");
  const [rule, setRule] = useState({
    rule: series?.rule || "weekly",
    interval: series?.interval || 1,
    weekdays: series?.weekdays || [
      new Date(`${event.date}T12:00:00Z`).getUTCDay(),
    ],
    nth: series?.nth || 1,
    until: series?.until || "",
    dates: series?.dates || [],
  });
  function field<K extends keyof CalendarEvent>(key: K, v: CalendarEvent[K]) {
    setValue((old) => ({ ...old, [key]: v }));
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl [&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
        <DialogHeader>
          <DialogTitle>
            {event.id ? "Edit activity" : "Add activity"}
          </DialogTitle>
          <DialogDescription>
            {event.calendarIds.length > 1
              ? "Shared activity: edits update every linked calendar. Publishing remains separate."
              : "Create a one-off activity or a recurring schedule."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(
              {
                ...value,
                ...(repeat !== "none"
                  ? { recurrence: { ...rule, rule: repeat } }
                  : {}),
              },
              scope,
            );
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="event-title">Title</FieldLabel>
              <Input
                id="event-title"
                className="min-h-11 text-base"
                value={value.title}
                maxLength={180}
                required
                onChange={(e) => field("title", e.target.value)}
              />
            </Field>
            <FieldSet>
              <FieldLegend>Calendars</FieldLegend>
              {doc.calendars
                .filter((c) => !c.archived)
                .map((c) => (
                  <Check
                    key={c.id}
                    label={c.name}
                    checked={value.calendarIds.includes(c.id)}
                    onChange={(v) =>
                      field(
                        "calendarIds",
                        v
                          ? [...value.calendarIds, c.id]
                          : value.calendarIds.filter((id) => id !== c.id),
                      )
                    }
                  />
                ))}
            </FieldSet>
            <Field>
              <FieldLabel htmlFor="event-date">Date</FieldLabel>
              <Input
                id="event-date"
                className="min-h-11 text-base"
                type="date"
                required
                value={value.date}
                onChange={(e) => field("date", e.target.value)}
              />
            </Field>
            <Check
              label="All day / untimed"
              checked={value.allDay}
              onChange={(v) => field("allDay", v)}
            />
            {!value.allDay && (
              <>
                <Field>
                  <FieldLabel htmlFor="event-time">Start time</FieldLabel>
                  <Input
                    id="event-time"
                    className="min-h-11 text-base"
                    type="time"
                    required
                    value={value.time}
                    onChange={(e) => field("time", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="event-end">
                    End time (optional)
                  </FieldLabel>
                  <Input
                    id="event-end"
                    className="min-h-11 text-base"
                    type="time"
                    value={value.endTime}
                    onChange={(e) => field("endTime", e.target.value)}
                  />
                </Field>
              </>
            )}
            <Field>
              <FieldLabel htmlFor="event-location">Location</FieldLabel>
              <select
                id="event-location"
                className={selectClass}
                value={value.locationId}
                onChange={(e) => field("locationId", e.target.value)}
              >
                <option value="">No location</option>
                {doc.locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="event-category">Category</FieldLabel>
              <select
                id="event-category"
                className={selectClass}
                value={value.category}
                onChange={(e) =>
                  field("category", e.target.value as CalendarEvent["category"])
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="event-host">Host / leader</FieldLabel>
              <Input
                id="event-host"
                className="min-h-11 text-base"
                value={value.host}
                onChange={(e) => field("host", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="event-notes">
                Notes (printed in italics)
              </FieldLabel>
              <Textarea
                id="event-notes"
                className="text-base"
                value={value.notes}
                onChange={(e) => field("notes", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="event-detail">
                Movie title, station or sports matchup
              </FieldLabel>
              <Input
                id="event-detail"
                className="min-h-11 text-base"
                value={value.detail}
                onChange={(e) => field("detail", e.target.value)}
              />
            </Field>
            <FieldSet>
              <FieldLegend>Display & attendance</FieldLegend>
              <Check
                label="Featured / bold"
                checked={value.featured}
                onChange={(v) => field("featured", v)}
              />
              <Check
                label="Banner entry"
                checked={value.banner}
                onChange={(v) => field("banner", v)}
              />
              <Check
                label="Sign-up required"
                checked={value.signUp}
                onChange={(v) => field("signUp", v)}
              />
              <Check
                label="Cancelled (keep visible)"
                checked={!!value.cancelled}
                onChange={(v) => field("cancelled", v)}
              />
            </FieldSet>
            {value.signUp && (
              <Field>
                <FieldLabel htmlFor="event-contact">Sign-up contact</FieldLabel>
                <Input
                  id="event-contact"
                  className="min-h-11 text-base"
                  value={value.contact}
                  onChange={(e) => field("contact", e.target.value)}
                />
              </Field>
            )}
            {value.calendarIds.length > 1 && (
              <FieldSet>
                <FieldLegend>Per-calendar overrides</FieldLegend>
                <p className="text-sm text-muted-foreground">
                  Leave blank to use the shared time and location.
                </p>
                {value.calendarIds.map((id) => (
                  <div
                    key={id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-3"
                  >
                    <p className="font-semibold">
                      {doc.calendars.find((c) => c.id === id)?.name}
                    </p>
                    <Field>
                      <FieldLabel htmlFor={`override-time-${id}`}>
                        Start time override
                      </FieldLabel>
                      <Input
                        id={`override-time-${id}`}
                        type="time"
                        className="min-h-11 text-base"
                        value={value.overrides[id]?.time || ""}
                        onChange={(e) =>
                          field("overrides", {
                            ...value.overrides,
                            [id]: {
                              ...value.overrides[id],
                              time: e.target.value || undefined,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`override-location-${id}`}>
                        Location override
                      </FieldLabel>
                      <select
                        id={`override-location-${id}`}
                        className={selectClass}
                        value={value.overrides[id]?.locationId || ""}
                        onChange={(e) =>
                          field("overrides", {
                            ...value.overrides,
                            [id]: {
                              ...value.overrides[id],
                              locationId: e.target.value || undefined,
                            },
                          })
                        }
                      >
                        <option value="">Shared location</option>
                        {doc.locations
                          .filter((l) =>
                            doc.calendars
                              .find((c) => c.id === id)
                              ?.locationIds.includes(l.id),
                          )
                          .map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.code}
                            </option>
                          ))}
                      </select>
                    </Field>
                  </div>
                ))}
              </FieldSet>
            )}
            {series && (
              <Field>
                <FieldLabel htmlFor="event-scope">Apply changes to</FieldLabel>
                <select
                  id="event-scope"
                  className={selectClass}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  <option value="one">This occurrence only</option>
                  <option value="following">
                    This and following occurrences
                  </option>
                  <option value="series">The entire series</option>
                </select>
              </Field>
            )}
            {(!series || scope !== "one") && (
              <>
                <Field>
                  <FieldLabel htmlFor="event-repeat">Repeat</FieldLabel>
                  <select
                    id="event-repeat"
                    className={selectClass}
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value)}
                  >
                    {(!series
                      ? ["none", "weekly", "interval", "nth", "custom"]
                      : ["weekly", "interval", "nth", "custom"]
                    ).map((v) => (
                      <option key={v} value={v}>
                        {
                          {
                            none: "Does not repeat",
                            weekly: "Weekly",
                            interval: "Every N weeks",
                            nth: "Nth weekday of the month",
                            custom: "Custom dates",
                          }[v]
                        }
                      </option>
                    ))}
                  </select>
                </Field>
                {repeat !== "none" && (
                  <FieldSet>
                    <FieldLegend>Recurring schedule</FieldLegend>
                    <Field>
                      <FieldLabel htmlFor="recurrence-days">
                        Weekdays
                      </FieldLabel>
                      <div
                        className="flex flex-wrap gap-2"
                        id="recurrence-days"
                      >
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (day, n) => (
                            <Check
                              key={day}
                              label={day}
                              checked={rule.weekdays.includes(n)}
                              onChange={(v) =>
                                setRule((r) => ({
                                  ...r,
                                  weekdays: v
                                    ? [...r.weekdays, n]
                                    : r.weekdays.filter((x) => x !== n),
                                }))
                              }
                            />
                          ),
                        )}
                      </div>
                    </Field>
                    {repeat === "interval" && (
                      <Field>
                        <FieldLabel htmlFor="interval">
                          Every N weeks
                        </FieldLabel>
                        <Input
                          id="interval"
                          type="number"
                          className="min-h-11 text-base"
                          min={1}
                          max={52}
                          value={rule.interval}
                          onChange={(e) =>
                            setRule((r) => ({
                              ...r,
                              interval: Number(e.target.value),
                            }))
                          }
                        />
                      </Field>
                    )}
                    {repeat === "nth" && (
                      <Field>
                        <FieldLabel htmlFor="nth">Occurrence</FieldLabel>
                        <select
                          id="nth"
                          className={selectClass}
                          value={rule.nth}
                          onChange={(e) =>
                            setRule((r) => ({
                              ...r,
                              nth: Number(e.target.value),
                            }))
                          }
                        >
                          {[1, 2, 3, 4, 5, -1].map((n) => (
                            <option key={n} value={n}>
                              {n === -1 ? "Last" : n}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}
                    {repeat === "custom" && (
                      <Field>
                        <FieldLabel htmlFor="custom-dates">
                          Dates (one YYYY-MM-DD per line)
                        </FieldLabel>
                        <Textarea
                          id="custom-dates"
                          className="text-base"
                          value={rule.dates.join("\n")}
                          onChange={(e) =>
                            setRule((r) => ({
                              ...r,
                              dates: e.target.value.split("\n"),
                            }))
                          }
                        />
                      </Field>
                    )}
                    <Field>
                      <FieldLabel htmlFor="recurrence-end">
                        Series end date (optional)
                      </FieldLabel>
                      <Input
                        id="recurrence-end"
                        className="min-h-11 text-base"
                        type="date"
                        value={rule.until}
                        onChange={(e) =>
                          setRule((r) => ({ ...r, until: e.target.value }))
                        }
                      />
                    </Field>
                  </FieldSet>
                )}
              </>
            )}
          </FieldGroup>
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button
              className="min-h-11"
              type="submit"
              disabled={pending || !value.calendarIds.length}
            >
              {pending ? "Saving…" : "Save activity"}
            </Button>
            <Button
              className="min-h-11"
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            {event.id && (
              <>
                <Button
                  className="min-h-11"
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    onSave({ ...value, id: "", seriesId: undefined }, "one")
                  }
                >
                  Duplicate as one-off
                </Button>
                <Button
                  className="min-h-11"
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Remove this occurrence from the draft? The published version stays unchanged until republished.",
                      )
                    )
                      onDelete(event.id);
                  }}
                >
                  Remove occurrence
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
