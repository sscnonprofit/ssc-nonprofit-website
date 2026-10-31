import { siteUrl } from "./config"

const WINE = "#6b1e3a"
const GOLD = "#b8892b"
const INK = "#2a2226"
const MUTED = "#6e6268"
const PAPER = "#f6f1ea"

export type Rendered = { subject: string; html: string; text: string }

export function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

type LayoutInput = {
  preheader: string
  heading: string
  body: string
  cta?: { label: string; url: string }
  footer?: string
}

function layout({ preheader, heading, body, cta, footer }: LayoutInput) {
  const home = siteUrl()
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:${PAPER};font-family:Georgia,'Times New Roman',serif;color:${INK};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6dccf;">
<tr><td style="background:${WINE};padding:22px 32px;border-bottom:4px solid ${GOLD};">
<a href="${home}" style="color:#ffffff;text-decoration:none;font-size:18px;font-weight:bold;letter-spacing:0.02em;">Sheboygan Senior Community</a>
</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${WINE};">${esc(heading)}</h1>
<div style="font-size:16px;line-height:1.65;color:${INK};">${body}</div>
${
  cta
    ? `<p style="margin:28px 0 0;"><a href="${cta.url}" style="display:inline-block;background:${WINE};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:15px;padding:14px 26px;border-radius:10px;">${esc(cta.label)}</a></p>`
    : ""
}
</td></tr>
<tr><td style="padding:20px 32px;background:#faf6f0;border-top:1px solid #e6dccf;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
${footer ? `<p style="margin:0 0 8px;">${footer}</p>` : ""}
<p style="margin:0;">Sheboygan Senior Community &middot; 3505 County Road Y, Sheboygan, WI 53083 &middot; (920) 458-2137</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function p(text: string) {
  return `<p style="margin:0 0 14px;">${text}</p>`
}

function detailTable(rows: [string, string][]) {
  const body = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};vertical-align:top;white-space:nowrap;">${esc(label)}</td><td style="padding:8px 0;font-size:15px;color:${INK};">${value}</td></tr>`,
    )
    .join("")
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border-top:1px solid #eee3d6;width:100%;">${body}</table>`
}

/* ---------------------------- Account and security ---------------------------- */

export function verificationCodeEmail(input: { name: string; code: string; minutes: number }): Rendered {
  return {
    subject: `Your SSC sign-in code: ${input.code}`,
    text: `Hello ${input.name}, your Sheboygan Senior Community sign-in code is ${input.code}. It expires in ${input.minutes} minutes. If you did not try to sign in, change your password right away.`,
    html: layout({
      preheader: `Your sign-in code is ${input.code}`,
      heading: "Your sign-in code",
      body:
        p(`Hello ${esc(input.name)}, use this code to finish signing in to the SSC website admin.`) +
        `<p style="margin:18px 0;font-family:'Courier New',monospace;font-size:34px;letter-spacing:0.3em;font-weight:bold;color:${WINE};background:#faf6f0;border:1px dashed ${GOLD};border-radius:10px;text-align:center;padding:16px 0;">${esc(input.code)}</p>` +
        p(`This code expires in ${input.minutes} minutes. If you did not try to sign in, please change your password right away.`),
    }),
  }
}

export function passwordResetEmail(input: { name: string; url: string }): Rendered {
  return {
    subject: "Reset your SSC admin password",
    text: `Hello ${input.name}, reset your password here: ${input.url} (link expires in 1 hour). If you did not ask for this, you can ignore this email.`,
    html: layout({
      preheader: "Use this link to choose a new password",
      heading: "Reset your password",
      body:
        p(`Hello ${esc(input.name)}, we received a request to reset the password for your SSC website account.`) +
        p("This link expires in one hour. If you did not request a reset, you can safely ignore this email and your password will stay the same."),
      cta: { label: "Choose a new password", url: input.url },
    }),
  }
}

export function passwordChangedEmail(input: { name: string }): Rendered {
  return {
    subject: "Your SSC admin password was changed",
    text: `Hello ${input.name}, the password on your SSC website account was just changed. If this was not you, contact an administrator immediately.`,
    html: layout({
      preheader: "Security notice for your SSC account",
      heading: "Your password was changed",
      body: p(`Hello ${esc(input.name)}, the password on your SSC website account was just changed.`) + p("If this was not you, reset your password again and tell an administrator immediately."),
      cta: { label: "Go to sign in", url: `${siteUrl()}/admin/login` },
    }),
  }
}

export function welcomeStaffEmail(input: { name: string; role: string }): Rendered {
  const roleLine = input.role === "admin" ? "an administrator" : "an editor"
  return {
    subject: "Welcome to the SSC website admin",
    text: `Welcome ${input.name}! Your account was created as ${roleLine}. Sign in at ${siteUrl()}/admin/login.`,
    html: layout({
      preheader: "Your SSC website account is ready",
      heading: `Welcome, ${input.name}`,
      body:
        p(`Your account has been created and you are set up as ${roleLine}.`) +
        p("Open your profile to turn on email sign-in codes (two-factor authentication) for extra protection."),
      cta: { label: "Open the admin", url: `${siteUrl()}/admin/profile` },
    }),
  }
}

/* ---------------------------------- Events ---------------------------------- */

type EventMailInput = {
  name: string
  title: string
  when: string
  location: string
  guests: number
  eventUrl: string
  contact?: string
}

export function rsvpConfirmationEmail(input: EventMailInput & { waitlisted: boolean }): Rendered {
  const heading = input.waitlisted ? "You're on the waitlist" : "You're signed up"
  const intro = input.waitlisted
    ? `Thank you, ${esc(input.name)}. This date is currently full, so we added you to the waitlist. We will email you if a spot opens.`
    : `Thank you, ${esc(input.name)}. We are looking forward to seeing you. A calendar file is attached so you can add this to your calendar.`
  return {
    subject: input.waitlisted ? `Waitlist: ${input.title}` : `Confirmed: ${input.title}`,
    text: `${heading}: ${input.title}\nWhen: ${input.when}\nWhere: ${input.location || "Sheboygan Senior Community"}\nGuests: ${input.guests}\n${input.eventUrl}`,
    html: layout({
      preheader: `${input.title} — ${input.when}`,
      heading,
      body:
        p(intro) +
        detailTable([
          ["Event", esc(input.title)],
          ["When", esc(input.when)],
          ["Where", esc(input.location || "Sheboygan Senior Community")],
          ["Guests", String(input.guests)],
          ["Questions", esc(input.contact ?? "")],
        ]),
      cta: { label: "View event details", url: input.eventUrl },
    }),
  }
}

export function rsvpReminderEmail(input: EventMailInput): Rendered {
  return {
    subject: `Reminder: ${input.title} is tomorrow`,
    text: `Reminder: ${input.title}\nWhen: ${input.when}\nWhere: ${input.location || "Sheboygan Senior Community"}\n${input.eventUrl}`,
    html: layout({
      preheader: `${input.title} — ${input.when}`,
      heading: "See you soon",
      body:
        p(`Hello ${esc(input.name)}, this is a friendly reminder about an event you signed up for.`) +
        detailTable([
          ["Event", esc(input.title)],
          ["When", esc(input.when)],
          ["Where", esc(input.location || "Sheboygan Senior Community")],
          ["Guests", String(input.guests)],
        ]),
      cta: { label: "View event details", url: input.eventUrl },
    }),
  }
}

/* ------------------------------ Calendar digests ------------------------------ */

export function subscriptionConfirmEmail(input: { calendarName: string; url: string }): Rendered {
  return {
    subject: `Confirm your ${input.calendarName} updates`,
    text: `Confirm you'd like ${input.calendarName} updates every 30 days: ${input.url}`,
    html: layout({
      preheader: "One click to confirm your subscription",
      heading: "Please confirm your subscription",
      body:
        p(`You asked to receive an email every 30 days with upcoming activities from the <strong>${esc(input.calendarName)}</strong> calendar, with a calendar file attached.`) +
        p("Confirm to start receiving them. If this wasn't you, just ignore this email and nothing will be sent."),
      cta: { label: "Confirm subscription", url: input.url },
    }),
  }
}

export type DigestGroup = { dateLabel: string; items: { time: string; title: string; location: string; category: string }[] }

export function calendarDigestEmail(input: {
  calendarName: string
  periodLabel: string
  groups: DigestGroup[]
  manageUrl: string
  unsubscribeUrl: string
}): Rendered {
  const total = input.groups.reduce((sum, group) => sum + group.items.length, 0)
  const list = input.groups.length
    ? input.groups
        .map(
          (group) =>
            `<h2 style="margin:22px 0 6px;font-size:16px;color:${WINE};border-bottom:2px solid ${GOLD};padding-bottom:4px;">${esc(group.dateLabel)}</h2>` +
            group.items
              .map(
                (item) =>
                  `<p style="margin:0 0 10px;"><strong>${esc(item.time)}</strong> &nbsp;${esc(item.title)}${
                    item.location ? `<br><span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};">${esc(item.location)} &middot; ${esc(item.category)}</span>` : ""
                  }</p>`,
              )
              .join(""),
        )
        .join("")
    : p("There are no scheduled activities for this period yet. Check back soon.")
  const textList = input.groups
    .map((group) => `${group.dateLabel}\n${group.items.map((item) => `  ${item.time} ${item.title}${item.location ? ` (${item.location})` : ""}`).join("\n")}`)
    .join("\n\n")
  return {
    subject: `${input.calendarName}: ${input.periodLabel}`,
    text: `${input.calendarName} — ${input.periodLabel}\n\n${textList || "No scheduled activities yet."}\n\nUnsubscribe: ${input.unsubscribeUrl}`,
    html: layout({
      preheader: `${total} ${total === 1 ? "activity" : "activities"} — ${input.periodLabel}`,
      heading: input.periodLabel,
      body: p(`Here is what is coming up on the <strong>${esc(input.calendarName)}</strong> calendar. The attached file adds every activity to your phone or computer calendar.`) + list,
      cta: { label: "See the full calendar", url: `${siteUrl()}/calendars` },
      footer: `<a href="${input.manageUrl}" style="color:${MUTED};">Manage preferences</a> &middot; <a href="${input.unsubscribeUrl}" style="color:${MUTED};">Unsubscribe</a>`,
    }),
  }
}

/* ---------------------------- Inquiries and staff ---------------------------- */

export function inquiryReceivedEmail(input: { name: string; topic: string }): Rendered {
  return {
    subject: "We received your message",
    text: `Thank you, ${input.name}. We received your message${input.topic ? ` about ${input.topic}` : ""} and someone will be in touch shortly. For urgent needs call (920) 458-2137.`,
    html: layout({
      preheader: "A team member will be in touch shortly",
      heading: `Thank you, ${input.name}`,
      body:
        p(`We received your message${input.topic ? ` about <strong>${esc(input.topic)}</strong>` : ""}. A member of our team will be in touch shortly.`) +
        p("If you need help right away, please call us at <a href=\"tel:+19204582137\" style=\"color:" + WINE + ";\">(920) 458-2137</a>."),
    }),
  }
}

export function newsletterWelcomeEmail(): Rendered {
  return {
    subject: "Welcome to Sheboygan Senior Community updates",
    text: "Thank you for subscribing to updates from Sheboygan Senior Community.",
    html: layout({
      preheader: "Thank you for staying connected",
      heading: "You're on the list",
      body: p("Thank you for subscribing. We will share news, stories, and events from our community.") + p("Want activity schedules delivered automatically? You can subscribe to a calendar on our events page."),
      cta: { label: "Browse upcoming events", url: `${siteUrl()}/upcoming-events` },
    }),
  }
}

export function applicationReceivedEmail(input: { name: string; position: string }): Rendered {
  return {
    subject: `We received your application${input.position ? ` for ${input.position}` : ""}`,
    text: `Thank you, ${input.name}. We received your application${input.position ? ` for ${input.position}` : ""} and our team will review it.`,
    html: layout({
      preheader: "Thank you for applying",
      heading: `Thank you for applying, ${input.name}`,
      body: p(`We received your application${input.position ? ` for <strong>${esc(input.position)}</strong>` : ""}. Our team reviews every application and will contact you if there is a fit.`),
    }),
  }
}

export function staffNotificationEmail(input: { title: string; rows: [string, string][]; adminPath: string }): Rendered {
  return {
    subject: input.title,
    text: `${input.title}\n${input.rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n${siteUrl()}${input.adminPath}`,
    html: layout({
      preheader: input.title,
      heading: input.title,
      body: detailTable(input.rows.map(([label, value]) => [label, esc(value).replace(/\n/g, "<br>")])),
      cta: { label: "Open in admin", url: `${siteUrl()}${input.adminPath}` },
    }),
  }
}

export function testEmail(input: { sentBy: string }): Rendered {
  return {
    subject: "SSC email test",
    text: `This is a test message sent by ${input.sentBy}. Email delivery through Resend is working.`,
    html: layout({
      preheader: "Email delivery is working",
      heading: "Email delivery is working",
      body: p(`This test message was sent by ${esc(input.sentBy)} from the SSC admin. Sign-in codes, RSVP confirmations, reminders, and calendar digests will use this same sender.`),
    }),
  }
}
