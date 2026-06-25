import { date } from 'yup'

// Método para calcular HH:MM desde minutos
export const formatMinutesToHHMM = totalMinutes => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// Método para calcular los minutos desde HH:MM
export const convertHHMMToMinutes = time => {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

// Método para calcular HH:MM desde minutos
export const formatMinutesToHM = totalMinutes => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
}

export const formatDateToYmd = date => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // Month is zero-based
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Método que indica si el tiempo de trabajo dado (h m s) es negativo, positivo o neutro mas bien para el border de abajo del cuadrante
export function checkNegativity(timeStr) {
  const match = timeStr.match(/(-?\d+)h\s*(-?\d+)m\s*(-?\d+)s/)
  if (match) {
    const [, hours, minutes, seconds] = match.map(Number)
    if (hours < 0 || minutes < 0 || seconds < 0) {
      return 2 // At least one component is negative
    } else if (hours === 0 && minutes === 0 && seconds === 0) {
      return 0 // All components are zero
    } else {
      return 1 // All components are positive
    }
  } else {
    throw new Error('Invalid time format')
  }
}

export function AmericanToEurope(dateString) {
  const dateParts = dateString.split('-') // Split the date string into parts
  const year = dateParts[0]
  const month = dateParts[1]
  const day = dateParts[2]

  return `${day}-${month}-${year}` // Format the date as "DD-MM-YYYY"
}

export function EuropeToAmerican(dateString) {
  const [day, month, year] = dateString.split('-')

  return `${year}-${month}-${day}`
}

// Convertimos los tiempos dados en el cuadrante a segundos
export function parseDuration(duration) {
  // Dividimos el tiempo dado
  const [hours, minutes, seconds] = duration.split(' ')

  // Parse each part into integers
  const parsedHours = parseInt(hours.replace('h', ''))
  const parsedMinutes = parseInt(minutes.replace('m', ''))
  const parsedSeconds = parseInt(seconds.replace('s', ''))

  const hoursCalculated = parsedHours * 3600
  const minutesCalculated = parsedMinutes * 60

  // Convertimos horas, minutos y segundos en segundos
  return hoursCalculated + minutesCalculated + parsedSeconds
}

//
export function operateDurations(duration1, duration2, operation = 'add') {
  const seconds1 = parseDuration(duration1)
  const seconds2 = parseDuration(duration2)

  let resultSeconds
  if (operation === 'add') {
    resultSeconds = seconds1 + seconds2
  } else if (operation === 'subtract') {
    resultSeconds = seconds1 - seconds2
  } else {
    throw new Error(`Unknown operation: ${operation}`)
  }

  return formatDuration(resultSeconds)
}

// Convertimos los segundos a los tiempos
export function formatDuration(seconds) {
  // Determine the sign of the total duration
  const sign = Math.sign(seconds)

  // Take the absolute value of seconds for calculation
  const absSeconds = Math.abs(seconds)

  // Convert seconds into hours, minutes, and remaining seconds
  const hours = Math.floor(absSeconds / 3600) * sign
  const minutes = Math.floor((absSeconds % 3600) / 60) * sign
  const remainingSeconds = (absSeconds % 60) * sign

  // Format the duration string
  return `${hours}h ${minutes}m ${remainingSeconds}s`
}

// Convertimos los tiempos a los tiempos escrito
export function formatDurationTimes(hours, minutes, seconds) {
  // Format the duration string
  return `${hours}h ${minutes}m ${seconds}s`
}

export function formatTime(hours, minutes, seconds) {
  const pad = num => String(num).padStart(2, '0')

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

// Convertimos las duraciones a un array
export function convertDurationToArray(duration) {
  const [hours, minutes, seconds] = duration.split(' ')

  // Parse each part into integers
  const parsedHours = parseInt(hours.replace('h', ''))
  const parsedMinutes = parseInt(minutes.replace('m', ''))
  const parsedSeconds = parseInt(seconds.replace('s', ''))

  return [parsedHours, parsedMinutes, parsedSeconds]
}

// Convertimos por ejemplo de 08h 30m 00s a minutos
export function convertTimeToMinutes(timeString) {
  // Split the time string into hours, minutes, and seconds
  const [hours, minutes] = timeString.split(' ')

  // Parse each part into integers
  const parsedHours = parseInt(hours.replace('h', ''))
  const parsedMinutes = parseInt(minutes.replace('m', ''))

  // Convert hours and minutes to minutes
  const totalMinutes = parsedHours * 60 + parsedMinutes

  return totalMinutes
}

export function replaceDuration(total, oldValue, newValue) {
  if (parseDuration(oldValue) === parseDuration(newValue)) {
    return total // sin cambios
  }

  return operateDurations(operateDurations(total, oldValue, 'subtract'), newValue, 'add')
}

export function parseTime(s) {
  if (!s) return null

  // "HH:mm" o "HH:mm:ss"
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s)
  if (m) {
    const d = new Date()
    d.setHours(Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : 0, 0)

    return d
  }

  // Fallback: ISO (con o sin zona)
  const d = new Date(s)

  return isNaN(d.getTime()) ? null : d
}

export function parseDurationStr(s, { clamp } = {}) {
  if (!s) return { h: 0, m: 0, s: 0, totalSeconds: 0 }

  const t = String(s).trim()
  let h = 0,
    m = 0,
    sec = 0

  // 1) “02h 00m 00s”, “2h 15m”, etc.
  const labeled = /^\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?\s*$/i.exec(t)
  if (labeled && (labeled[1] || labeled[2] || labeled[3])) {
    h = parseInt(labeled[1] || '0', 10)
    m = parseInt(labeled[2] || '0', 10)
    sec = parseInt(labeled[3] || '0', 10)
  } else {
    // 2) “HH:mm[:ss]”
    const colon = /^\s*(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*$/.exec(t)
    if (colon) {
      h = parseInt(colon[1], 10)
      m = parseInt(colon[2], 10)
      sec = parseInt(colon[3] || '0', 10)
    } else {
      // 3) Rescate: piezas sueltas
      const hh = /(\d+)\s*h/i.exec(t)?.[1]
      const mm = /(\d+)\s*m/i.exec(t)?.[1]
      const ss = /(\d+)\s*s/i.exec(t)?.[1]
      h = parseInt(hh || '0', 10)
      m = parseInt(mm || '0', 10)
      sec = parseInt(ss || '0', 10)
    }
  }

  let totalSeconds = h * 3600 + m * 60 + sec

  // clamp opcional (máx 23:59:59)
  if (clamp) {
    const MAX = 23 * 3600 + 59 * 60 + 59
    totalSeconds = Math.max(0, Math.min(totalSeconds, MAX))
  }

  const H = Math.floor(totalSeconds / 3600)
  const M = Math.floor((totalSeconds % 3600) / 60)
  const S = totalSeconds % 60

  return { h: H, m: M, s: S, totalSeconds }
}
