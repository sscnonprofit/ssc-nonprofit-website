// One-time seed: copies the bundled content/*.json files into the `pages`
// table as the initial published content for each CMS document, so the
// admin editor shows real data from the start instead of an empty draft.
// Safe to re-run — it skips any slug that already has a row.
//
// Usage: node scripts/seed-pages.mjs
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { Pool } from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

const docs = [
  { slug: "site", label: "Site Settings", file: "site.json" },
  { slug: "home", label: "Home", file: "home.json" },
  { slug: "company", label: "Our Company", file: "company.json" },
  { slug: "challenge", label: "The Challenge", file: "challenge.json" },
  { slug: "events", label: "Upcoming Events", file: "events.json" },
  { slug: "gallery", label: "Artists Gallery", file: "gallery.json" },
  { slug: "pillars", label: "Pillars", file: "pillars.json" },
  { slug: "services", label: "Services", file: "services.json" },
]

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const client = await pool.connect()
  try {
    for (const doc of docs) {
      const { rows } = await client.query("select 1 from pages where slug = $1", [doc.slug])
      if (rows.length > 0) {
        console.log(`skip  ${doc.slug} (already seeded)`)
        continue
      }
      const raw = readFileSync(path.join(root, "content", doc.file), "utf-8")
      const content = JSON.parse(raw) // validate it's real JSON before inserting
      await client.query(
        `insert into pages (slug, title, content, status) values ($1, $2, $3, 'published')`,
        [doc.slug, doc.label, content],
      )
      console.log(`seeded ${doc.slug}`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
