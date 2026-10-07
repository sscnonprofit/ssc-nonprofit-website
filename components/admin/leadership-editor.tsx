"use client"

import { ObjectFields } from "@/components/admin/visual-editor/object-fields"
import { ArrayField } from "@/components/admin/visual-editor/array-field"
import { emptyLeadershipMember } from "@/lib/cms/leadership"

export function LeadershipEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (next: Record<string, unknown>) => void }) {
  const team = content.team as Record<string, unknown> | undefined
  if (!team || !Array.isArray(team.members)) return <ObjectFields data={content} onChange={onChange} />
  const { team: ignoredTeam, ...settings } = content
  const { members, ...teamSettings } = team
  return (
    <div className="flex flex-col gap-6 [&_input]:min-h-11 [&_input]:text-base [&_textarea]:text-base [&_button]:min-h-11">
      <p className="text-sm leading-relaxed text-muted-foreground">Edit page settings below. Add, remove, or drag team members into order. Turn off Visible to hide a member without deleting them. Save a draft before previewing; publish when ready.</p>
      <ObjectFields data={settings} onChange={(next) => onChange({ ...next, team })} />
      <ObjectFields data={teamSettings} onChange={(next) => onChange({ ...content, team: { ...next, members } })} />
      <ArrayField label="Team members" items={members as unknown[]} itemTemplate={emptyLeadershipMember} depth={0} onChange={(next) => onChange({ ...content, team: { ...team, members: next } })} />
    </div>
  )
}
