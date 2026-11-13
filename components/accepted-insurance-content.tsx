import { acceptedInsuranceHtml } from "@/lib/accepted-insurance-html"

export function isMedicareEnrollmentOpen(date: Date) {
  const [month, day] = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "numeric",
    day: "numeric",
  }).format(date).split("/").map(Number)

  return (month === 10 && day >= 15) || month === 11 || (month === 12 && day <= 7)
}

export function AcceptedInsuranceContent() {
  const html = isMedicareEnrollmentOpen(new Date())
    ? acceptedInsuranceHtml
    : acceptedInsuranceHtml.replace(/<div class="ssc-ins__deadline"[\s\S]*?<\/div>/, "")

  // Only the reviewed, repository-owned HTML is rendered, never CMS or request input.
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
