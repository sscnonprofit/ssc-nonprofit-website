"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Printer,
  Settings,
  History,
  CalendarDays,
  Upload,
  Copy,
  RefreshCw,
  Eraser,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CalendarView, EventDetails } from "./calendar-view";
import { EventEditor, selectClass } from "./event-editor";
import { CalendarSettings } from "./calendar-settings";
import {
  blankEvent,
  CATEGORIES,
  facilityToday,
  forCalendar,
  isDate,
  monthKey,
  monthLabel,
  notesFor,
  occurrences,
  shiftMonth,
  warnings,
  type CalendarDocument,
  type CalendarEvent,
  type Workspace,
} from "@/lib/calendars/model";
import type { CalendarAction } from "@/lib/calendars/service";
import { cn } from "@/lib/utils";

async function fetcher(url: string) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not load calendars");
  return data;
}
export function CalendarWorkspace({
  initial,
  admin = false,
}: {
  initial: Workspace | CalendarDocument;
  admin?: boolean;
}) {
  const {
    data,
    mutate,
    error: loadError,
  } = useSWR<Workspace | CalendarDocument>(
    `/api/calendars${admin ? "?admin=1" : ""}`,
    fetcher,
    { fallbackData: initial, revalidateOnFocus: false },
  );
  const workspace = admin ? (data as Workspace) : undefined;
  const doc = (admin ? workspace!.document : data) as CalendarDocument;
  const calendars = [...doc.calendars]
    .filter((c) => !c.archived)
    .sort((a, b) => a.order - b.order);
  const [calendarId, setCalendarId] = useState(calendars[0]?.id || "all");
  const [month, setMonth] = useState(() => {
    const now = facilityToday().slice(0, 7);
    const months = Object.keys(doc.months)
      .map((k) => k.split(":")[1])
      .sort();
    return months.includes(now) ? now : months.at(-1) || now;
  });
  const [category, setCategory] = useState("all"),
    [large, setLarge] = useState(false),
    [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null),
    [panel, setPanel] = useState("");
  const [error, setError] = useState("");
  const calendar = calendars.find((c) => c.id === calendarId);
  const canEdit =
    !!workspace &&
    !!calendar &&
    (workspace.role === "admin" ||
      (workspace.role === "editor" &&
        calendar.editorIds.includes(workspace.userId)));
  const all = occurrences(doc, month);
  const events = all.filter(
    (e) =>
      (calendarId === "all" || e.calendarIds.includes(calendarId)) &&
      (category === "all" || e.category === category),
  );
  const notes = admin
    ? calendars
        .filter((c) => calendarId === "all" || c.id === calendarId)
        .flatMap((c) => notesFor(doc, c, month))
    : doc.notes.filter(
        (n) =>
          n.date.startsWith(month) &&
          (calendarId === "all" || n.calendarIds.includes(calendarId)),
      );
  const dedupedNotes = [
    ...new Map(notes.map((n) => [`${n.id}:${n.text}`, n])).values(),
  ];
  const issues = calendar ? warnings(all, calendarId) : [];
  const state = doc.months[monthKey(calendarId, month)];
  const monthCount = all.filter((e) => e.calendarIds.includes(calendarId)).length;
  async function run(action: Omit<CalendarAction, "version">) {
    if (!workspace || pending) return false;
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...action, version: workspace.version }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to save");
      await mutate(json, false);
      toast.success("Calendar saved");
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to save";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setPending(false);
    }
  }
  const base = { calendarId, month };
  return (
    <div className="flex min-w-0 flex-col gap-6 font-sans text-foreground">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {admin
              ? "Resident life · Calendar"
              : "Sheboygan Senior Community"}
          </p>
          <h1 className="text-balance font-sans text-3xl font-semibold tracking-tight">
            {admin ? "Activity calendars" : "A good day starts here."}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            {admin
              ? "Plan once. Share across neighborhoods. Print with confidence."
              : "Find familiar favorites, new experiences and time together. Choose your community below."}
          </p>
        </div>
        {admin && (
          <Link
            href="/calendars"
            className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
          >
            Public calendar
          </Link>
        )}
      </header>
      {(error || loadError) && (
        <Alert variant="destructive">
          <AlertTitle>Could not save or load</AlertTitle>
          <AlertDescription>
            {error || loadError?.message}
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => {
                mutate();
                setError("");
              }}
            >
              Reload latest version
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <section
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground"
        aria-label="Calendar controls"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <Field className="flex-1">
            <FieldLabel htmlFor="calendar-select">
              Community calendar
            </FieldLabel>
            <select
              id="calendar-select"
              className={selectClass}
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="all">All calendars</option>
            </select>
          </Field>
          <Field className="md:w-48">
            <FieldLabel htmlFor="category-select">Category</FieldLabel>
            <select
              id="category-select"
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All activities</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="min-h-11 min-w-11"
              aria-label="Previous month"
              onClick={() => setMonth(shiftMonth(month, -1))}
            >
              <ChevronLeft />
            </Button>
            <label className="sr-only" htmlFor="calendar-month">
              Month
            </label>
            <Input
              id="calendar-month"
              type="month"
              className="min-h-11 w-44 text-base"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
            />
            <Button
              variant="outline"
              size="icon"
              className="min-h-11 min-w-11"
              aria-label="Next month"
              onClick={() => setMonth(shiftMonth(month, 1))}
            >
              <ChevronRight />
            </Button>
          </div>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => {
              const today = facilityToday();
              setMonth(today.slice(0, 7));
              window.setTimeout(
                () =>
                  document
                    .getElementById(`day-${today}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                50,
              );
            }}
          >
            Today
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button
              className="min-h-11"
              onClick={() => setSelected(blankEvent(`${month}-01`, calendarId))}
            >
              <Plus data-icon="inline-start" />
              Add activity
            </Button>
          )}
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setPanel("print")}
          >
            <Printer data-icon="inline-start" />
            Print / PDF
          </Button>
          {!admin && (
            <Button
              variant="outline"
              className="min-h-11"
              aria-pressed={large}
              onClick={() => setLarge((v) => !v)}
            >
              {large ? "Standard text" : "Larger text"}
            </Button>
          )}
          {admin && workspace?.role === "admin" && (
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setPanel("settings")}
            >
              <Settings data-icon="inline-start" />
              Manage
            </Button>
          )}
        </div>
      </section>
      <section className="flex flex-col gap-3" aria-label="Month overview">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            {monthLabel(month)}
          </h2>
          {admin && (
            <Badge variant="secondary">
              {state?.status === "published"
                ? "Published snapshot · editing draft"
                : "Draft"}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {events.length} activities
          </span>
        </div>
        {calendar && (
          <p className="text-base text-muted-foreground">{calendar.subtitle}</p>
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {calendars
            .filter((c) => calendarId === "all" || c.id === calendarId)
            .map((c) => (
              <span key={c.id} className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "size-3 rounded-full",
                    c.color === "wine" ? "bg-primary" : "bg-accent",
                  )}
                  aria-hidden="true"
                />
                {c.name}
              </span>
            ))}
        </div>
        {canEdit && (
          <details className="rounded-lg border border-border p-3">
            <summary className="min-h-11 cursor-pointer py-2 text-base font-medium">
              Monthly workflow
            </summary>
            <div className="flex flex-wrap gap-2 pt-3">
              <Button
                variant="outline"
                className="min-h-11"
                disabled={pending}
                onClick={() =>
                  run({ action: "month", ...base, data: { generate: true } })
                }
              >
                <RefreshCw data-icon="inline-start" />
                Generate month
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={pending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Copy last month’s one-off activities to the same day numbers? Recurring series are not copied.",
                    )
                  )
                    run({ action: "copyPrevious", ...base });
                }}
              >
                <Copy data-icon="inline-start" />
                Copy last month
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => setPanel("bulk")}
              >
                <Upload data-icon="inline-start" />
                Bulk add
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => setPanel("note")}
              >
                Day note / banner
              </Button>
              <Button
                variant="destructive"
                className="min-h-11"
                disabled={pending || !monthCount}
                onClick={() => {
                  if (
                    window.confirm(
                      [
                        `Clear all ${monthCount} ${monthCount === 1 ? "activity" : "activities"} from ${calendar!.name} for ${monthLabel(month)}?`,
                        "One-off activities are removed and the recurring schedule is hidden until you click Generate month. Day notes and banners are kept.",
                        state?.status === "published"
                          ? "The published calendar stays live until you publish again."
                          : "",
                        "An admin can undo this from History.",
                      ]
                        .filter(Boolean)
                        .join("\n\n"),
                    )
                  )
                    run({ action: "clearMonth", ...base });
                }}
              >
                <Eraser data-icon="inline-start" />
                Clear month
              </Button>
              {workspace?.role === "admin" && (
                <>
                  <Button
                    className="min-h-11"
                    disabled={pending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Publish this month’s current draft to residents?",
                        )
                      )
                        run({
                          action: "month",
                          ...base,
                          data: { publish: true },
                        });
                    }}
                  >
                    Publish month
                  </Button>
                  {state?.status === "published" && (
                    <Button
                      variant="outline"
                      className="min-h-11"
                      disabled={pending}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Remove this month from the public calendar?",
                          )
                        )
                          run({
                            action: "month",
                            ...base,
                            data: { unpublish: true },
                          });
                      }}
                    >
                      Unpublish
                    </Button>
                  )}
                </>
              )}
              {workspace?.role === "admin" && (
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setPanel("history")}
                >
                  <History data-icon="inline-start" />
                  History & restore
                </Button>
              )}
            </div>
            <p className="pt-3 text-sm leading-relaxed text-muted-foreground">
              Generate is safe to repeat. Draft edits never change the published
              snapshot. Drag activities between days on desktop, or edit their
              date on mobile.
            </p>
          </details>
        )}
        {admin && issues.length > 0 && (
          <details className="rounded-lg border border-border bg-muted/40 p-3">
            <summary className="min-h-11 cursor-pointer py-2 font-medium">
              {issues.length} planning warnings
            </summary>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
              {issues.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="pt-3 text-sm text-muted-foreground">
              Events without end times are checked for identical start times.
              Add end times for full overlap checks.
            </p>
          </details>
        )}
      </section>
      <CalendarView
        document={doc}
        month={month}
        events={events}
        notes={dedupedNotes}
        calendarId={calendarId}
        large={large}
        onEvent={(e) =>
          setSelected(admin ? all.find((v) => v.id === e.id) || e : e)
        }
        onDay={
          canEdit
            ? (date) => setSelected(blankEvent(date, calendarId))
            : undefined
        }
        onMove={
          canEdit
            ? (event, date) =>
                run({ action: "event", data: { ...event, date }, scope: "one" })
            : undefined
        }
      />
      <details className="rounded-xl border border-border p-4">
        <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold">
          Location guide & calendar subscriptions
        </summary>
        <dl className="grid gap-3 py-4 sm:grid-cols-2">
          {doc.locations
            .filter((l) =>
              calendars.some(
                (c) =>
                  (calendarId === "all" || c.id === calendarId) &&
                  c.locationIds.includes(l.id),
              ),
            )
            .map((l) => (
              <div key={l.id}>
                <dt className="text-base font-semibold">{l.code}</dt>
                <dd className="text-base text-muted-foreground">{l.name}</dd>
              </div>
            ))}
        </dl>
        <div className="flex flex-col gap-2">
          {calendars
            .filter((c) => c.visibility === "public")
            .map((c) => (
              <a
                key={c.id}
                className="min-h-11 py-2 text-base font-medium underline underline-offset-4"
                href={`/api/calendars/ics?calendar=${c.id}`}
              >
                Subscribe to {c.name} (.ics)
              </a>
            ))}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Copy a subscription link into your calendar app to receive published
          updates. All times are local to Sheboygan (America/Chicago).
        </p>
      </details>
      {selected &&
        (admin &&
        (workspace?.role === "admin" ||
          (workspace?.role === "editor" &&
            selected.calendarIds.every((id) =>
              doc.calendars
                .find((c) => c.id === id)
                ?.editorIds.includes(workspace.userId),
            ))) ? (
          <EventEditor
            key={selected.id || selected.date}
            event={selected}
            document={doc}
            pending={pending}
            onClose={() => setSelected(null)}
            onSave={async (event, scope) => {
              if (await run({ action: "event", data: event, scope }))
                setSelected(null);
            }}
            onDelete={async (id) => {
              if (await run({ action: "delete", id })) setSelected(null);
            }}
          />
        ) : (
          <EventDetails
            event={selected}
            document={doc}
            onClose={() => setSelected(null)}
          />
        ))}
      {panel === "settings" && workspace && (
        <CalendarSettings
          workspace={workspace}
          pending={pending}
          run={run}
          onClose={() => setPanel("")}
        />
      )}
      {panel === "bulk" && (
        <BulkDialog
          calendarId={calendarId}
          month={month}
          pending={pending}
          onClose={() => setPanel("")}
          onConfirm={async (values) => {
            if (await run({ action: "bulk", data: values })) setPanel("");
          }}
        />
      )}
      {panel === "note" && (
        <NoteDialog
          month={month}
          pending={pending}
          onClose={() => setPanel("")}
          onSave={async (value) => {
            if (await run({ action: "note", ...base, data: value }))
              setPanel("");
          }}
        />
      )}
      {panel === "print" && (
        <PrintDialog
          document={doc}
          calendarId={calendarId}
          month={month}
          admin={admin}
          canEdit={canEdit}
          pending={pending}
          onClose={() => setPanel("")}
          onHeader={(url) =>
            run({ action: "month", ...base, data: { headerImage: url } })
          }
        />
      )}
      {panel === "history" && (
        <Dialog open onOpenChange={(v) => !v && setPanel("")}>
          <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl [&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
            <DialogHeader>
              <DialogTitle>Change history</DialogTitle>
              <DialogDescription>
                Restore a complete workspace to its state before a change.
                Restoration is itself recorded.
              </DialogDescription>
            </DialogHeader>
            {!workspace?.history.length && (
              <p>No changes yet. Your first save will appear here.</p>
            )}
            {workspace?.history.map((h) => (
              <div
                key={h.id}
                className="flex flex-col gap-2 border-b border-border py-3"
              >
                <p className="font-medium">{h.summary}</p>
                <p className="text-sm text-muted-foreground">
                  {h.actorName} · {new Date(h.createdAt).toLocaleString()}
                </p>
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={pending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Restore the entire calendar workspace, including publication snapshots and settings?",
                      )
                    )
                      run({ action: "restore", id: String(h.id) });
                  }}
                >
                  Restore this version
                </Button>
              </div>
            ))}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function BulkDialog({
  calendarId,
  month,
  pending,
  onClose,
  onConfirm,
}: {
  calendarId: string;
  month: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (events: CalendarEvent[]) => void;
}) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<CalendarEvent[] | null>(null);
  const [error, setError] = useState("");
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl [&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
        <DialogHeader>
          <DialogTitle>Bulk add activities</DialogTitle>
          <DialogDescription>
            One event per line: YYYY-MM-DD | HH:MM | Title. Nothing is created
            until you confirm the preview.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bulk-events">Paste your list</FieldLabel>
            <Textarea
              id="bulk-events"
              className="min-h-40 text-base"
              placeholder={`${month}-01 | 19:00 | Football game`}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setPreview(null);
              }}
            />
          </Field>
        </FieldGroup>
        {error && <p role="alert">{error}</p>}
        <Button
          className="min-h-11"
          variant="outline"
          onClick={() => {
            try {
              const lines = text.split("\n").filter((l) => l.trim());
              if (!lines.length || lines.length > 200)
                throw new Error("Paste 1–200 lines.");
              const values = lines.map((line, i) => {
                const parts = line.split("|").map((v) => v.trim());
                if (
                  parts.length !== 3 ||
                  !isDate(parts[0]) ||
                  !/^([01]\d|2[0-3]):[0-5]\d$/.test(parts[1]) ||
                  !parts[2]
                )
                  throw new Error(
                    `Check date, time and title on line ${i + 1}`,
                  );
                return {
                  ...blankEvent(parts[0], calendarId),
                  time: parts[1],
                  title: parts[2],
                };
              });
              setPreview(values);
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Preview import
        </Button>
        {preview && (
          <>
            <ul className="flex flex-col gap-2 text-base">
              {preview.map((e, i) => (
                <li key={i}>
                  {e.date} · {e.time} · {e.title}
                </li>
              ))}
            </ul>
            <Button
              className="min-h-11"
              disabled={pending}
              onClick={() => onConfirm(preview)}
            >
              Confirm {preview.length} activities
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
function NoteDialog({
  month,
  pending,
  onClose,
  onSave,
}: {
  month: string;
  pending: boolean;
  onClose: () => void;
  onSave: (v: { date: string; text: string; banner: boolean }) => void;
}) {
  const [date, setDate] = useState(`${month}-01`),
    [text, setText] = useState(""),
    [banner, setBanner] = useState(false);
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="[&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
        <DialogHeader>
          <DialogTitle>Add a day note</DialogTitle>
          <DialogDescription>
            Shown at the bottom of a day, or as a banner.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ date, text, banner });
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="note-date">Date</FieldLabel>
              <Input
                id="note-date"
                type="date"
                className="min-h-11 text-base"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="note-text">Note</FieldLabel>
              <Textarea
                id="note-text"
                className="text-base"
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                className="size-5"
                checked={banner}
                onChange={(e) => setBanner(e.target.checked)}
              />
              Display as a banner
            </label>
          </FieldGroup>
          <Button className="min-h-11" disabled={pending}>
            Save note
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function PrintDialog({
  document: doc,
  calendarId,
  month,
  admin,
  canEdit,
  pending,
  onClose,
  onHeader,
}: {
  document: CalendarDocument;
  calendarId: string;
  month: string;
  admin: boolean;
  canEdit: boolean;
  pending: boolean;
  onClose: () => void;
  onHeader: (url: string) => Promise<boolean>;
}) {
  const [target, setTarget] = useState(calendarId),
    [mode, setMode] = useState(
      doc.calendars.find((c) => c.id === calendarId)?.printMode || "month",
    );
  const [image, setImage] = useState(
    doc.months[monthKey(calendarId, month)]?.headerImage || "",
  );
  const url = `/api/calendars/pdf?month=${month}&calendar=${target}&mode=${mode}${admin ? "&admin=1" : ""}`;
  const {
    data,
    error,
    mutate: recheck,
  } = useSWR<{ overflow: string[]; warnings: string[] }>(
    `${url}&check=1`,
    fetcher,
    { revalidateOnFocus: false },
  );
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg [&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
        <DialogHeader>
          <DialogTitle>Print with confidence</DialogTitle>
          <DialogDescription>
            Server-generated landscape letter PDF. Fixed weekday headers and
            date positions never move with event text.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="print-target">Calendar pages</FieldLabel>
            <select
              id="print-target"
              className={selectClass}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              {doc.calendars
                .filter((c) => !c.archived)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              <option value="all">Each calendar on its own pages</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="print-mode">Format</FieldLabel>
            <select
              id="print-mode"
              className={selectClass}
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="month">Monthly grid · auto-fit</option>
              <option value="week">Weekly grid · one week per page</option>
              <option value="large">Large print · one day per page</option>
            </select>
          </Field>
          {canEdit && (
            <Field>
              <FieldLabel htmlFor="header-image">
                This month’s header image URL (PNG/JPEG)
              </FieldLabel>
              <Input
                id="header-image"
                className="min-h-11 text-base"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                For PDF safety, use your Vercel Blob public URL or a local
                /images/ file.
              </p>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={pending}
                onClick={async () => {
                  if (await onHeader(image)) recheck();
                }}
              >
                Save header image for selected community
              </Button>
            </Field>
          )}
        </FieldGroup>
        {!data && !error && (
          <p role="status">Checking every cell for text fit…</p>
        )}
        {error && <p role="alert">{error.message}</p>}
        {data && (
          <div className="flex flex-col gap-2 text-sm leading-relaxed">
            <p>
              {data.overflow.length
                ? "Some content does not fit. Choose weekly or large print before export."
                : "All content fits. Headers and dates are locked in position."}
            </p>
            {data.overflow.map((s) => (
              <p key={s}>{s}</p>
            ))}
            {data.warnings.length > 0 && (
              <details>
                <summary className="min-h-11 cursor-pointer py-3 font-medium">
                  {data.warnings.length} days use small text — review options
                </summary>
                <div className="flex flex-col gap-2">
                  {data.warnings.map((s) => (
                    <p key={s}>{s}</p>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
        <a
          className={cn(
            buttonVariants(),
            "min-h-11",
            (!data || data.overflow.length > 0) &&
              "pointer-events-none opacity-50",
          )}
          href={data && !data.overflow.length ? url : undefined}
          aria-disabled={!data || !!data.overflow.length}
          target="_blank"
          rel="noreferrer"
        >
          Download PDF{admin ? " (current draft)" : ""}
        </a>
      </DialogContent>
    </Dialog>
  );
}
