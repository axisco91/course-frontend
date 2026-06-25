export const truncateText = (text, maxLength) => {
  let str: string
  if (!text) return ''

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

export const stripHtml = html => {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  return doc.body.textContent || ''
}

export const replaceUnderscoreWithSpace = str => {
  return str.replace(/_/g, ' ')
}

export const formatLength = (text: string) => {
  return text
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(new RegExp(`(.200)`, 'g'), '$1\n') // Insert line breaks
}
