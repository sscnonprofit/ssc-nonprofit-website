const BULLET_PREFIX = /^[\s\-*\u2022\u2013\u2014]+/

export function toParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

/**
 * Turns an editor's free-text field into list items. One item per line is the
 * documented format, but single-line text separated by semicolons is split too
 * so older postings still render as a proper list.
 */
export function toListItems(text: string) {
  const byLine = text
    .split("\n")
    .map((line) => line.replace(BULLET_PREFIX, "").trim())
    .filter(Boolean)
  const items = byLine.length === 1 && byLine[0].includes(";") ? byLine[0].split(";") : byLine
  return items
    .map((item) => item.trim().replace(/\.$/, ""))
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
}
