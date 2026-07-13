const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export function renderTemplate(content, values) {
  if (!content) {
    return ''
  }

  return content.replace(PLACEHOLDER_REGEX, (_, key) => {
    const value = values[key]
    return value === undefined || value === null ? '' : String(value)
  })
}
