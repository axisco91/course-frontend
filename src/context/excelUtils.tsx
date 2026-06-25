import * as XLSX from 'xlsx'

// Cambiar la fecha de un excel
export const dateFromExcelSerial = serial => {
  const date = new Date(Date.UTC(1899, 11, 30, 0, 0, 0)) // December 30, 1899
  date.setDate(date.getDate() + serial + 1) // Adding 1 to account for the discrepancy

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0') // Months are zero-indexed
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Convierte una celda de Excel que representa una HORA a 'HH:mm:ss'
 * - Soporta fracción de día (número), Date y string.
 * - No usa UTC (evita desplazamientos).
 */
export const timeFromExcelFraction = (val: any): string => {
  if (val == null || val === '') return ''

  // 1) Fracción de día (0..1)
  if (typeof val === 'number') {
    const total = Math.round(val * 24 * 60 * 60)
    const h = Math.floor(total / 3600) % 24
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // 2) Date
  if (val instanceof Date) {
    const h = String(val.getHours()).padStart(2, '0') // LOCAL
    const m = String(val.getMinutes()).padStart(2, '0')
    const s = String(val.getSeconds()).padStart(2, '0')

    return `${h}:${m}:${s}`
  }

  // 3) String (ya formateado)
  if (typeof val === 'string') {
    // Normalizar a HH:mm:ss si viniera HH:mm
    if (/^\d{1,2}:\d{2}$/.test(val)) return `${val}:00`

    return val
  }

  return ''
}

/**
 * Convierte una celda de Excel que representa una FECHA a 'yyyy-mm-dd'
 * - Soporta: número serial de Excel, Date, y string.
 * - No usa UTC (evita el "día menos").
 */
export const parseExcelDate = (val: any): string => {
  if (val == null || val === '') return ''

  // 1) Si ya viene como Date
  if (val instanceof Date) {
    const y = val.getFullYear() // LOCAL
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')

    return `${y}-${m}-${d}`
  }

  // 2) Si es número serial de Excel
  if (typeof val === 'number') {
    const p = XLSX.SSF.parse_date_code(val)
    if (!p) return ''
    const y = p.y
    const m = String(p.m).padStart(2, '0')
    const d = String(p.d).padStart(2, '0')

    return `${y}-${m}-${d}`
  }

  // 3) Si es string
  if (typeof val === 'string') {
    // dd/mm/yyyy -> yyyy-mm-dd
    if (val.includes('/')) {
      const [dd, mm, yyyy] = val.split('/')
      if (yyyy && mm && dd) {
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
      }
    }

    // ya puede venir yyyy-mm-dd
    return val
  }

  return ''
}
