import assert from "node:assert/strict"
import { test } from "node:test"
import fallback from "../../content/pillars.json"
import { getPartnerSection, partnerSectionsEqual, remainingPartnerDraft, replacePartnerSection, safePartnerUrl, validatePartnerSection } from "./partners"

const section = () => getPartnerSection(fallback)

test("legacy partners retain their content and get stable editor defaults", () => {
  const result = section()
  assert.equal(result.partners.length, fallback["community-outreach"].partners.length)
  assert.equal(result.partners[0].name, fallback["community-outreach"].partners[0].name)
  assert.equal(result.partners[0].alt, result.partners[0].name)
  assert.equal(result.partners[0].visible, true)
  assert.deepEqual(validatePartnerSection(result), result)
  assert(partnerSectionsEqual(result, section()))
})

test("only partner content changes when drafting, including order and visibility", () => {
  const next = section()
  next.title = "Our community"
  next.partners.reverse()
  next.partners[0].visible = false
  const result = replacePartnerSection(fallback, next) as typeof fallback
  assert.deepEqual(result.community, fallback.community)
  assert.equal(result["community-outreach"].intro, fallback["community-outreach"].intro)
  assert.deepEqual(getPartnerSection(result), next)
  assert.notEqual(getPartnerSection(fallback).title, next.title)
})

test("publishing partners preserves unrelated pillar drafts without publishing them", () => {
  const draft = structuredClone(fallback)
  draft.community.title = "Unpublished community headline"
  draft["community-outreach"].intro = "Unpublished outreach introduction"
  const next = section()
  next.partners = next.partners.slice(1)
  const savedDraft = replacePartnerSection(draft, next)
  const published = replacePartnerSection(fallback, next) as typeof fallback
  const remaining = remainingPartnerDraft(published, savedDraft, next) as typeof fallback
  assert.equal(published.community.title, fallback.community.title)
  assert.equal(published["community-outreach"].intro, fallback["community-outreach"].intro)
  assert.equal(remaining.community.title, draft.community.title)
  assert.equal(remaining["community-outreach"].intro, draft["community-outreach"].intro)
  assert.deepEqual(getPartnerSection(remaining), next)
})

test("publishing or discarding the only partner draft clears the draft slot", () => {
  const original = section()
  const next = section()
  next.enabled = false
  const draft = replacePartnerSection(fallback, next)
  assert.equal(remainingPartnerDraft(replacePartnerSection(fallback, next), draft, next), null)
  assert.equal(remainingPartnerDraft(fallback, draft, original), null)
  assert.equal(remainingPartnerDraft(fallback, null, original), null)
})

test("discarding partner changes preserves unrelated drafts", () => {
  const draft = structuredClone(fallback)
  draft.community.title = "Draft title"
  const modified = section()
  modified.partners = []
  const remainder = remainingPartnerDraft(fallback, replacePartnerSection(draft, modified), section()) as typeof fallback
  assert.equal(remainder.community.title, "Draft title")
  assert.deepEqual(getPartnerSection(remainder), section())
})

test("unsafe links and logo sources are rejected", () => {
  for (const url of ["javascript:alert(1)", "data:image/svg+xml,test", "//evil.example/logo.png", "https://user:pass@example.com", "https://example.com\n", "/images/../private", "/images/\\evil", "file:///etc/passwd"]) {
    assert.equal(safePartnerUrl(url, true), false, url)
  }
  assert(safePartnerUrl("https://example.com/logo.png", true))
  assert(safePartnerUrl("/images/logo.png", true))
  assert.equal(safePartnerUrl("/images/logo.png"), false)
  const input = section()
  input.partners[0].href = "javascript:alert(1)"
  assert.throws(() => validatePartnerSection(input), /website/)
  input.partners[0].href = "https://example.org"
  input.partners[0].logo = "data:image/png;base64,test"
  assert.throws(() => validatePartnerSection(input), /logo URL/)
})

test("validates limits, required fields, duplicate IDs and visibility", () => {
  assert.throws(() => validatePartnerSection(null))
  assert.throws(() => validatePartnerSection({ ...section(), title: "  " }), /heading/)
  assert.throws(() => validatePartnerSection({ ...section(), partners: Array(101).fill(section().partners[0]) }), /100 partners/)
  assert.throws(() => validatePartnerSection({ ...section(), partners: [section().partners[0], section().partners[0]] }), /unique/)
  assert.throws(() => validatePartnerSection({ ...section(), enabled: "yes" }), /whether/)
  assert.throws(() => validatePartnerSection({ ...section(), partners: [{ ...section().partners[0], visible: "true" }] }), /visible/)
  assert.throws(() => validatePartnerSection({ ...section(), partners: [{ ...section().partners[0], name: "" }] }), /name/)
})

test("supports empty directories, optional websites and accessible name defaults", () => {
  assert.equal(validatePartnerSection({ ...section(), partners: [] }).partners.length, 0)
  const input = section()
  input.partners[0].href = ""
  input.partners[0].alt = ""
  const result = validatePartnerSection(input)
  assert.equal(result.partners[0].href, "")
  assert.equal(result.partners[0].alt, result.partners[0].name)
})
