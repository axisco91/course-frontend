export const formatDateDMY = (value?: string | null) => {
  if (!value) return ''

  const date = String(value).slice(0, 10)
  const [year, month, day] = date.split('-')

  return year && month && day ? `${day}/${month}/${year}` : String(value)
}

export const festivalLabel = (option: any) => {
  if (!option) return ''

  const name = String(option.name ?? option.label ?? option.festival_name ?? '')
  const day = formatDateDMY(option.day ?? option.festival?.day ?? option.nacional_festival?.day)

  return day ? `${name} - ${day}` : name
}

export const optionKey = (option: any) => {
  if (!option) return ''

  const id = option.id ?? option.value ?? option.uuid ?? ''
  const name = option.name ?? option.label ?? option.festival_name ?? ''
  const day = option.day ?? option.festival?.day ?? option.nacional_festival?.day ?? ''

  return [id, name, day].filter(Boolean).join('-') || name
}
