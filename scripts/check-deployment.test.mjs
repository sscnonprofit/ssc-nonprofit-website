import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import test from "node:test"

import { checkEnvironment, checkSchema, inspectDatabase, requiredTables } from "./check-deployment.mjs"

const validEnvironment = {
  BETTER_AUTH_SECRET: randomBytes(32).toString("base64"),
  DATABASE_URL: "postgresql://user:private-password@localhost:5432/website",
}
const metadata = requiredTables.flatMap((table) => table.columns.map((column) => ({
  table_schema: table.schema,
  table_name: table.name,
  column_name: column,
})))

test("reports missing secret and database without exposing values", () => {
  assert.equal(checkEnvironment({}).length, 2)
  assert.equal(checkEnvironment(validEnvironment).length, 0)
  const errors = checkEnvironment({ ...validEnvironment, BETTER_AUTH_SECRET: "better-auth-secret", DATABASE_URL: "https://user:private-password@example.com/database" })
  assert.equal(errors.length, 2)
  assert.ok(!errors.join(" ").includes("private-password"))
})

test("rejects short secrets and malformed database connections", () => {
  assert.equal(checkEnvironment({ ...validEnvironment, BETTER_AUTH_SECRET: " ".repeat(32) }).length, 1)
  for (const DATABASE_URL of ["", "not-a-url", "postgresql://localhost/"]) {
    assert.equal(checkEnvironment({ ...validEnvironment, DATABASE_URL }).length, 1)
  }
})

test("includes employment, gallery, and authentication tables", () => {
  const names = requiredTables.map((table) => table.name)
  for (const name of ["job_postings", "gallery_exhibitions", "user", "session", "account", "verification"]) {
    assert.ok(names.includes(name), `Missing readiness coverage for ${name}`)
  }
})

test("accepts a complete schema and ignores extra columns", () => {
  assert.deepEqual(checkSchema([...metadata, { table_schema: "public", table_name: "job_postings", column_name: "extra_column" }]), [])
})

test("identifies missing job and gallery tables before prerendering", () => {
  const rows = metadata.filter((row) => !["job_postings", "gallery_exhibitions"].includes(row.table_name))
  assert.deepEqual(checkSchema(rows).sort(), [
    "Missing database table: public.gallery_exhibitions",
    "Missing database table: public.job_postings",
  ])
})

test("detects missing camelCase authentication columns in the correct schema", () => {
  const rows = metadata.filter((row) => !(row.table_name === "account" && row.column_name === "issuer"))
  rows.push({ table_schema: "neon_auth", table_name: "account", column_name: "issuer" })
  assert.deepEqual(checkSchema(rows), ["Missing database columns in public.account: issuer"])
})

test("database inspection is parameterized and reads schema metadata only", async () => {
  const pool = {
    async query(sql, params) {
      assert.match(sql, /FROM information_schema\.columns/)
      assert.match(sql, /ANY\(\$1::text\[\]\)/)
      assert.match(sql, /ANY\(\$2::text\[\]\)/)
      assert.ok(!/\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\b/i.test(sql))
      assert.ok(params[1].includes("job_postings"))
      return { rows: metadata }
    },
  }
  assert.deepEqual(await inspectDatabase(pool), [])
})
