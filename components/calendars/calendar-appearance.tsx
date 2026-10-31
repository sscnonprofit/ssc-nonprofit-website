"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldSet, FieldLegend, FieldDescription } from "@/components/ui/field";
import { DEFAULT_APPEARANCE, calendarAppearance, printAccent } from "@/lib/calendars/appearance";
import { monthLabel, occurrences, notesFor, type Calendar, type CalendarAppearance, type CalendarDocument } from "@/lib/calendars/model";
import { Check, selectClass } from "./event-editor";
import { CalendarView } from "./calendar-view";

export function CalendarAppearanceControls({ calendar, document, onChange }: {
  calendar: Calendar;
  document: CalendarDocument;
  onChange: (calendar: Calendar) => void;
}) {
  const appearance = calendarAppearance(calendar);
  const month = Object.keys(document.months).filter((key) => key.startsWith(`${calendar.id}:`)).map((key) => key.split(":")[1]).sort().at(-1);
  const previewDocument = { ...document, calendars: document.calendars.map((c) => c.id === calendar.id ? calendar : c) };
  function update<K extends keyof CalendarAppearance>(key: K, value: CalendarAppearance[K]) {
    onChange({ ...calendar, appearance: { ...appearance, [key]: value } });
  }
  return (
    <FieldSet className="rounded-xl border border-border p-4">
      <FieldLegend>Appearance</FieldLegend>
      <FieldDescription>Customize this calendar on screen and in downloaded PDFs. Changes apply when you save settings; published event content stays unchanged.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="appearance-preset">Start with a preset</FieldLabel>
          <select id="appearance-preset" className={selectClass} value="custom" onChange={(e) => {
            const preset = e.target.value;
            if (preset === "custom") return;
            onChange({ ...calendar, theme: preset === "minimal" ? "minimal" : "classic", font: preset === "reading" ? "serif" : "sans", appearance: { ...DEFAULT_APPEARANCE, ...(preset === "reading" ? { fontSize: 20, density: "spacious" as const, shadeWeekends: true } : preset === "minimal" ? { gridLines: false } : {}) } });
          }}>
            <option value="custom">Choose a preset…</option>
            <option value="classic">Classic community calendar</option>
            <option value="minimal">Clean & minimal</option>
            <option value="reading">Easy reading</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="calendar-color">Default print accent</FieldLabel>
          <select id="calendar-color" className={selectClass} value={calendar.color} onChange={(e) => onChange({ ...calendar, color: e.target.value as Calendar["color"] })}>
            <option value="wine">SSC Wine</option><option value="gold">SSC Gold</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="appearance-accent">Custom accent color</FieldLabel>
          <div className="flex items-center gap-3">
            <Input id="appearance-accent" type="color" className="min-h-11 max-w-20" value={printAccent(calendar)} onChange={(e) => update("accentColor", e.target.value)} />
            <span className="text-sm text-muted-foreground">{appearance.accentColor || "Site colors / print default"}</span>
            {appearance.accentColor && <Button type="button" variant="ghost" onClick={() => update("accentColor", "")}>Use default</Button>}
          </div>
          <FieldDescription>Custom accents override screen and print colors. Header text contrast is adjusted automatically.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="calendar-theme">Weekday header style</FieldLabel>
          <select id="calendar-theme" className={selectClass} value={calendar.theme} onChange={(e) => onChange({ ...calendar, theme: e.target.value as Calendar["theme"] })}>
            <option value="classic">Classic — filled accent</option><option value="minimal">Minimal — neutral</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="calendar-font">Calendar font</FieldLabel>
          <select id="calendar-font" className={selectClass} value={calendar.font} onChange={(e) => onChange({ ...calendar, font: e.target.value as Calendar["font"] })}>
            <option value="sans">Sans serif</option><option value="serif">Serif</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="appearance-size">Activity text size · {appearance.fontSize}px</FieldLabel>
          <Input id="appearance-size" type="range" min={14} max={20} step={1} value={appearance.fontSize} onChange={(e) => update("fontSize", Number(e.target.value))} className="min-h-11" />
          <FieldDescription>PDF text scales proportionally, then auto-fits. Weekly or large print is best for larger type.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="appearance-density">Activity spacing</FieldLabel>
          <select id="appearance-density" className={selectClass} value={appearance.density} onChange={(e) => update("density", e.target.value as CalendarAppearance["density"])}>
            <option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="spacious">Spacious</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="appearance-week">Week starts on</FieldLabel>
          <select id="appearance-week" className={selectClass} value={appearance.weekStartsOn} onChange={(e) => update("weekStartsOn", Number(e.target.value) as 0 | 1)}>
            <option value={0}>Sunday</option><option value={1}>Monday</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="appearance-align">Date header alignment</FieldLabel>
          <select id="appearance-align" className={selectClass} value={appearance.headerAlign} onChange={(e) => update("headerAlign", e.target.value as CalendarAppearance["headerAlign"])}>
            <option value="left">Left</option><option value="center">Centered</option>
          </select>
        </Field>
        <FieldSet>
          <FieldLegend variant="label">Layout & visible details</FieldLegend>
          <Check label="Shade weekend days" checked={appearance.shadeWeekends} onChange={(v) => update("shadeWeekends", v)} />
          <Check label="Show grid lines" checked={appearance.gridLines} onChange={(v) => update("gridLines", v)} />
          <Check label="Show activity locations" checked={appearance.showLocation} onChange={(v) => update("showLocation", v)} />
          <Check label="Show activity notes and details" checked={appearance.showEventDetails} onChange={(v) => update("showEventDetails", v)} />
          <FieldDescription>These visibility controls simplify the calendar only. Full event details remain available when an activity is opened.</FieldDescription>
        </FieldSet>
      </FieldGroup>
      {month && <section className="flex min-w-0 flex-col gap-3" aria-label="Live appearance preview">
        <h4 className="text-base font-semibold">Live preview · {monthLabel(month)}</h4>
        <p className="text-sm text-muted-foreground">First three days, in agenda format. Preview updates as you customize.</p>
        <div className="max-h-80 overflow-y-auto rounded-lg border border-border p-3">
          <CalendarView document={previewDocument} month={month} events={occurrences(document, month).filter((e) => e.calendarIds.includes(calendar.id))} notes={calendar.showNotes ? notesFor(document, calendar, month) : []} calendarId={calendar.id} onEvent={() => {}} preview />
        </div>
      </section>}
      <Button type="button" variant="outline" className="min-h-11 self-start" onClick={() => onChange({ ...calendar, theme: "classic", font: "sans", appearance: { ...DEFAULT_APPEARANCE } })}>
        <RotateCcw data-icon="inline-start" />Reset appearance
      </Button>
    </FieldSet>
  );
}
