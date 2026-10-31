import company from "@/content/company.json"

export const emptyLeadershipMember = {
  name: "", role: "", image: "", imageAlt: "", visible: true,
  bio: { tenure: "", why: "", family: "", favorite: "" },
}

export function createLeadershipContent(source = company) {
  return {
    seo: { title: "Leadership", description: "Meet the leadership team at Sheboygan Senior Community.", image: source.hero.image, noindex: false },
    hero: { ...source.hero, eyebrow: "Our People", title: "Leadership", body: "Dedicated people. Compassionate leadership." },
    team: {
      title: source.team.title, body: source.team.body,
      members: source.team.members.map((member) => ({
        ...emptyLeadershipMember, ...member, imageAlt: member.name,
        bio: { ...emptyLeadershipMember.bio, ...("bio" in member ? member.bio : {}) },
      })),
    },
    biographyLabels: { why: "Why I love working at SSC", family: "Family and pets", favorite: "A favorite thing about Sheboygan County" },
    cta: { visible: true, title: "Come see the campus for yourself", body: "Walk the halls, meet the caregivers, and see our private rooms.", primary: { label: "Embrace the Next Chapter", href: "/contact" } },
  }
}

export type LeadershipContent = ReturnType<typeof createLeadershipContent>

export function validateLeadershipContent(value: unknown): asserts value is LeadershipContent {
  function check(actual: unknown, template: unknown, path: string) {
    if (Array.isArray(template)) {
      if (!Array.isArray(actual) || actual.length > 100) throw new Error(`${path} must be a list of at most 100 members.`)
      actual.forEach((item, index) => check(item, emptyLeadershipMember, `${path}.${index + 1}`))
      return
    }
    if (template && typeof template === "object") {
      if (!actual || typeof actual !== "object" || Array.isArray(actual)) throw new Error(`${path} must be an object.`)
      for (const [key, sample] of Object.entries(template)) check((actual as Record<string, unknown>)[key], sample, `${path}.${key}`)
      return
    }
    if (typeof actual !== typeof template) throw new Error(`${path} must be ${typeof template}.`)
    if (typeof actual === "string") {
      if (actual.length > 20000) throw new Error(`${path} is too long.`)
      if (path.endsWith(".href") && !/^(\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(actual)) throw new Error("Use a relative path or an HTTPS, email, or phone link for the call to action.")
      if (path.endsWith(".image") && actual && !/^(\/(?!\/)|https:\/\/)/i.test(actual)) throw new Error(`${path} must be a local image path or HTTPS URL.`)
    }
  }
  check(value, createLeadershipContent(), "Leadership")
  const content = value as LeadershipContent
  if (!content.hero.title.trim()) throw new Error("Leadership hero title is required.")
  if (!content.hero.image.trim()) throw new Error("Choose a leadership hero image before saving.")
}
