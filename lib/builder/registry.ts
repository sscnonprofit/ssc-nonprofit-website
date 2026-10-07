import { MAX_ELEMENTS, starterElements } from "@/lib/builder/elements"
import {
  DEFAULT_STYLE,
  DEFAULT_VISIBILITY,
  newId,
  sanitizeBuilderDoc,
  type BlockCategory,
  type BlockDefinition,
  type BuilderDoc,
  type Field,
  type Section,
  type SectionStyle,
} from "@/lib/builder/schema"

const heading: Field[] = [
  { key: "eyebrow", label: "Eyebrow", type: "text", max: 80 },
  { key: "title", label: "Heading", type: "text", max: 200 },
]

const button = (prefix: string, label: string): Field[] => [
  { key: `${prefix}Label`, label: `${label} label`, type: "text", max: 60 },
  { key: `${prefix}Href`, label: `${label} link`, type: "url", placeholder: "/contact or https://" },
]

const IMG = "/images/SSC_wide-angle-shot-of-new-building.jpg"

export const BLOCKS: BlockDefinition[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Large headline with buttons and an optional image.",
    category: "Hero",
    variants: [
      { value: "centered", label: "Centered" },
      { value: "split", label: "Split image" },
      { value: "background", label: "Full-bleed image" },
    ],
    fields: [
      ...heading,
      { key: "subtitle", label: "Subheading", type: "textarea", max: 500 },
      ...button("primary", "Primary button"),
      ...button("secondary", "Secondary button"),
      { key: "image", label: "Image", type: "image" },
      { key: "imageAlt", label: "Image description", type: "text", max: 200 },
    ],
    defaults: {
      eyebrow: "Sheboygan Senior Community",
      title: "Care that feels like home",
      subtitle: "A nonprofit senior community offering skilled nursing, rehabilitation, and assisted living.",
      primaryLabel: "Schedule a visit",
      primaryHref: "/contact",
      secondaryLabel: "Our services",
      secondaryHref: "/skilled-nursing",
      image: IMG,
      imageAlt: "Residents enjoying the campus",
    },
    defaultStyle: { paddingY: "lg" },
  },
  {
    type: "richText",
    label: "Text",
    description: "A heading with one or more paragraphs.",
    category: "Content",
    variants: [
      { value: "stacked", label: "Stacked" },
      { value: "split", label: "Heading left" },
    ],
    fields: [...heading, { key: "body", label: "Body", type: "textarea", max: 6000 }],
    defaults: {
      eyebrow: "Our story",
      title: "Rooted in the community since 1972",
      body: "Write a few short paragraphs here.\n\nLeave a blank line between paragraphs.",
    },
    defaultStyle: { width: "narrow" },
  },
  {
    type: "imageText",
    label: "Image + text",
    description: "Image beside a heading, text, and checklist.",
    category: "Content",
    variants: [
      { value: "imageLeft", label: "Image left" },
      { value: "imageRight", label: "Image right" },
    ],
    fields: [
      ...heading,
      { key: "body", label: "Body", type: "textarea", max: 3000 },
      { key: "image", label: "Image", type: "image" },
      { key: "imageAlt", label: "Image description", type: "text", max: 200 },
      ...button("button", "Button"),
      {
        key: "bullets",
        label: "Checklist",
        type: "list",
        itemLabel: "Point",
        max: 10,
        fields: [{ key: "text", label: "Text", type: "text", max: 160 }],
      },
    ],
    defaults: {
      eyebrow: "Why families choose us",
      title: "Personal care, delivered by people who know your name",
      body: "Our teams focus on dignity, independence, and connection every day.",
      image: IMG,
      imageAlt: "A caregiver with a resident",
      buttonLabel: "Learn more",
      buttonHref: "/our-company",
      bullets: [{ text: "24/7 licensed nursing" }, { text: "On-site therapy gym" }, { text: "Chef-prepared meals" }],
    },
  },
  {
    type: "features",
    label: "Feature cards",
    description: "A grid of cards with optional images and links.",
    category: "Content",
    variants: [
      { value: "3", label: "3 columns" },
      { value: "2", label: "2 columns" },
      { value: "4", label: "4 columns" },
    ],
    fields: [
      ...heading,
      { key: "intro", label: "Intro", type: "textarea", max: 600 },
      {
        key: "items",
        label: "Cards",
        type: "list",
        itemLabel: "Card",
        max: 12,
        fields: [
          { key: "image", label: "Image", type: "image" },
          { key: "title", label: "Title", type: "text", max: 120 },
          { key: "body", label: "Text", type: "textarea", max: 600 },
          { key: "linkLabel", label: "Link label", type: "text", max: 60 },
          { key: "href", label: "Link", type: "url" },
        ],
      },
    ],
    defaults: {
      eyebrow: "Services",
      title: "Care for every stage",
      intro: "",
      items: [
        { image: "", title: "Skilled nursing", body: "Around-the-clock clinical care.", linkLabel: "Learn more", href: "/skilled-nursing" },
        { image: "", title: "Short-term rehab", body: "Therapy to get you home sooner.", linkLabel: "Learn more", href: "/short-term-rehab" },
        { image: "", title: "Assisted living", body: "Independence with support nearby.", linkLabel: "Learn more", href: "/assisted-living" },
      ],
    },
    defaultStyle: { background: "muted" },
  },
  {
    type: "stats",
    label: "Stats",
    description: "Key numbers in a row.",
    category: "Social proof",
    variants: [
      { value: "plain", label: "Plain" },
      { value: "cards", label: "Cards" },
    ],
    fields: [
      { key: "title", label: "Heading", type: "text", max: 200 },
      {
        key: "items",
        label: "Stats",
        type: "list",
        itemLabel: "Stat",
        max: 6,
        fields: [
          { key: "value", label: "Value", type: "text", max: 20 },
          { key: "label", label: "Label", type: "text", max: 80 },
        ],
      },
    ],
    defaults: {
      title: "",
      items: [
        { value: "50+", label: "Years of service" },
        { value: "300", label: "Residents cared for" },
        { value: "24/7", label: "Licensed nursing" },
      ],
    },
    defaultStyle: { background: "primary", align: "center" },
  },
  {
    type: "cta",
    label: "Call to action",
    description: "A focused band with one or two buttons.",
    category: "Content",
    variants: [
      { value: "band", label: "Full band" },
      { value: "card", label: "Card" },
    ],
    fields: [
      { key: "title", label: "Heading", type: "text", max: 200 },
      { key: "body", label: "Text", type: "textarea", max: 600 },
      ...button("primary", "Primary button"),
      ...button("secondary", "Secondary button"),
    ],
    defaults: {
      title: "Come see the campus for yourself",
      body: "Tours are available seven days a week.",
      primaryLabel: "Schedule a visit",
      primaryHref: "/contact",
      secondaryLabel: "Donate",
      secondaryHref: "/donate",
    },
    defaultStyle: { background: "dark", align: "center" },
  },
  {
    type: "gallery",
    label: "Image gallery",
    description: "A grid or masonry layout of photos with captions.",
    category: "Media",
    variants: [
      { value: "grid", label: "Grid" },
      { value: "masonry", label: "Masonry" },
    ],
    fields: [
      ...heading,
      {
        key: "images",
        label: "Images",
        type: "list",
        itemLabel: "Image",
        max: 24,
        fields: [
          { key: "image", label: "Image", type: "image" },
          { key: "alt", label: "Description", type: "text", max: 200 },
          { key: "caption", label: "Caption", type: "text", max: 160 },
        ],
      },
    ],
    defaults: {
      eyebrow: "Gallery",
      title: "Life on campus",
      images: [1, 2, 3, 4, 5, 6].map((n) => ({
        image: `/placeholder.svg?height=${n % 2 ? 600 : 800}&width=800`,
        alt: `Campus photo ${n}`,
        caption: "",
      })),
    },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Quotes from residents and families.",
    category: "Social proof",
    variants: [
      { value: "grid", label: "Grid" },
      { value: "featured", label: "Featured quote" },
    ],
    fields: [
      ...heading,
      {
        key: "items",
        label: "Quotes",
        type: "list",
        itemLabel: "Quote",
        max: 9,
        fields: [
          { key: "quote", label: "Quote", type: "textarea", max: 800 },
          { key: "name", label: "Name", type: "text", max: 80 },
          { key: "role", label: "Role", type: "text", max: 80 },
          { key: "image", label: "Photo", type: "image" },
        ],
      },
    ],
    defaults: {
      eyebrow: "Kind words",
      title: "What families say",
      items: [
        { quote: "The staff treated Mom like family from the first day.", name: "Linda K.", role: "Daughter of a resident", image: "" },
        { quote: "Rehab here got me back on my feet and home in three weeks.", name: "Tom R.", role: "Rehab patient", image: "" },
        { quote: "We never worried once. That peace of mind is everything.", name: "The Alvarez family", role: "Family", image: "" },
      ],
    },
  },
  {
    type: "team",
    label: "Team",
    description: "People with photos, roles, and short bios.",
    category: "Social proof",
    variants: [
      { value: "grid", label: "Grid" },
      { value: "compact", label: "Compact list" },
    ],
    fields: [
      ...heading,
      {
        key: "items",
        label: "People",
        type: "list",
        itemLabel: "Person",
        max: 24,
        fields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "name", label: "Name", type: "text", max: 80 },
          { key: "role", label: "Role", type: "text", max: 80 },
          { key: "bio", label: "Bio", type: "textarea", max: 600 },
        ],
      },
    ],
    defaults: {
      eyebrow: "Leadership",
      title: "Meet the team",
      items: [
        { image: "", name: "Name Surname", role: "Executive Director", bio: "" },
        { image: "", name: "Name Surname", role: "Director of Nursing", bio: "" },
        { image: "", name: "Name Surname", role: "Community Relations", bio: "" },
      ],
    },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Questions and answers that expand on click.",
    category: "Content",
    variants: [
      { value: "stacked", label: "Stacked" },
      { value: "split", label: "Heading left" },
    ],
    fields: [
      ...heading,
      { key: "intro", label: "Intro", type: "textarea", max: 600 },
      {
        key: "items",
        label: "Questions",
        type: "list",
        itemLabel: "Question",
        max: 30,
        fields: [
          { key: "question", label: "Question", type: "text", max: 200 },
          { key: "answer", label: "Answer", type: "textarea", max: 2000 },
        ],
      },
    ],
    defaults: {
      eyebrow: "FAQ",
      title: "Common questions",
      intro: "",
      items: [
        { question: "Do you accept Medicare and Medicaid?", answer: "Yes. Our admissions team can walk you through coverage." },
        { question: "Can families visit any time?", answer: "Visitors are welcome daily. Call ahead for the latest guidance." },
      ],
    },
    defaultStyle: { width: "narrow" },
  },
  {
    type: "video",
    label: "Video",
    description: "Embed a YouTube or Vimeo video.",
    category: "Media",
    variants: [
      { value: "contained", label: "Contained" },
      { value: "wide", label: "Wide" },
    ],
    fields: [
      ...heading,
      { key: "url", label: "YouTube or Vimeo URL", type: "url", placeholder: "https://www.youtube.com/watch?v=..." },
      { key: "caption", label: "Caption", type: "text", max: 200 },
    ],
    defaults: { eyebrow: "", title: "Take a virtual tour", url: "", caption: "" },
  },
  {
    type: "contact",
    label: "Contact + map",
    description: "Address, phone, hours, and an optional map.",
    category: "Contact",
    variants: [
      { value: "map", label: "With map" },
      { value: "plain", label: "Details only" },
    ],
    fields: [
      ...heading,
      { key: "intro", label: "Intro", type: "textarea", max: 600 },
      { key: "address", label: "Address", type: "textarea", max: 300 },
      { key: "phone", label: "Phone", type: "text", max: 40 },
      { key: "email", label: "Email", type: "text", max: 120 },
      { key: "hours", label: "Hours", type: "textarea", max: 300 },
      { key: "mapQuery", label: "Map location", type: "text", max: 200, placeholder: "Street, City, State" },
    ],
    defaults: {
      eyebrow: "Visit us",
      title: "Get in touch",
      intro: "We are happy to answer questions or set up a tour.",
      address: "Sheboygan Senior Community\nSheboygan, WI",
      phone: "",
      email: "",
      hours: "Tours daily, 9am – 5pm",
      mapQuery: "Sheboygan Senior Community, Sheboygan, WI",
    },
  },
  {
    type: "spacer",
    label: "Spacer / divider",
    description: "Empty space, a line, or the SSC brand stripe.",
    category: "Layout",
    variants: [
      { value: "space", label: "Space" },
      { value: "line", label: "Line" },
      { value: "brand", label: "Brand stripe" },
    ],
    fields: [],
    defaults: {},
    defaultStyle: { paddingY: "sm" },
  },
  {
    type: "custom",
    label: "Custom section",
    description: "Build your own layout from text, images, buttons, and more.",
    category: "Custom",
    variants: [{ value: "default", label: "Default" }],
    fields: [{ key: "elements", label: "Elements", type: "elements", max: MAX_ELEMENTS }],
    get defaults() {
      return { elements: starterElements() }
    },
  },
]

export const BLOCK_MAP: Record<string, BlockDefinition> = Object.fromEntries(BLOCKS.map((b) => [b.type, b]))

export const BLOCK_CATEGORIES: BlockCategory[] = ["Hero", "Content", "Media", "Social proof", "Contact", "Layout", "Custom"]

export function createSection(type: string, overrides?: { variant?: string; style?: Partial<SectionStyle> }): Section {
  const def = BLOCK_MAP[type]
  return {
    id: newId(),
    type,
    variant: overrides?.variant ?? def.variants[0].value,
    label: "",
    props: structuredClone(def.defaults),
    style: { ...DEFAULT_STYLE, ...def.defaultStyle, ...overrides?.style },
    visibility: { ...DEFAULT_VISIBILITY },
    anchor: "",
  }
}

export function sanitizeDoc(input: unknown): BuilderDoc {
  return sanitizeBuilderDoc(input, BLOCK_MAP)
}

export const PAGE_TEMPLATES: { id: string; label: string; description: string; sections: () => Section[] }[] = [
  { id: "blank", label: "Blank", description: "Start from an empty page.", sections: () => [] },
  {
    id: "landing",
    label: "Landing",
    description: "Hero, services, stats, and a call to action.",
    sections: () => [createSection("hero", { variant: "split" }), createSection("features"), createSection("stats"), createSection("cta")],
  },
  {
    id: "about",
    label: "About",
    description: "Story, image with text, team, and testimonials.",
    sections: () => [
      createSection("hero"),
      createSection("richText"),
      createSection("imageText"),
      createSection("team"),
      createSection("testimonials", { style: { background: "muted" } }),
    ],
  },
  {
    id: "service",
    label: "Service",
    description: "Explain a service with features and an FAQ.",
    sections: () => [
      createSection("hero", { variant: "split" }),
      createSection("imageText", { variant: "imageRight" }),
      createSection("features"),
      createSection("faq"),
      createSection("cta"),
    ],
  },
  {
    id: "event",
    label: "Event",
    description: "Event details, photos, and directions.",
    sections: () => [
      createSection("hero", { variant: "background" }),
      createSection("richText"),
      createSection("gallery"),
      createSection("contact", { style: { background: "muted" } }),
    ],
  },
  {
    id: "contact",
    label: "Contact",
    description: "Contact details, map, and common questions.",
    sections: () => [createSection("hero"), createSection("contact"), createSection("faq", { style: { background: "muted" } })],
  },
]

export function newBuilderDoc(title: string, templateId: string): BuilderDoc {
  const template = PAGE_TEMPLATES.find((t) => t.id === templateId) ?? PAGE_TEMPLATES[0]
  const sections = template.sections()
  const hero = sections.find((s) => s.type === "hero")
  if (hero) hero.props.title = title
  return {
    kind: "builder",
    title,
    seo: { title: "", description: "", image: "", noindex: false },
    sections,
  }
}
