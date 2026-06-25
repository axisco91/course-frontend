const getCurrentYear = () => new Date().getFullYear()

// Ultimo 5 años
export const getLastFiveYears = () => {
  const currentYear = getCurrentYear()
  const lastFiveYears = []
  for (let i = currentYear - 5; i < currentYear; i++) {
    lastFiveYears.push(i)
  }

  return lastFiveYears
}

// Siguiente 5 años
export const getNextFiveYears = () => {
  const currentYear = getCurrentYear()
  const nextFiveYears = []
  for (let i = currentYear + 1; i <= currentYear + 5; i++) {
    nextFiveYears.push(i)
  }

  return nextFiveYears
}

export const getNextFiveYearsAfterYearGiven = year => {
  const currentYear = year
  const nextFiveYears = []
  for (let i = currentYear + 1; i <= currentYear + 5; i++) {
    nextFiveYears.push(i)
  }

  return nextFiveYears
}

// Obtenemos los años entre uno dado y el actual
export const getYearsBetweenYears = (firstYear, lastYear = null) => {
  const currentYear = lastYear ? lastYear : getCurrentYear()
  const years = []
  for (let i = firstYear; i <= currentYear; i++) {
    years.push(i)
  }

  return years
}

// Cambiamos de formato a las fechas
export const formatDate = inputDateStr => {
  // Parse the input date string into a Date object
  const inputDate = new Date(inputDateStr)

  // Extract year, month, and day components
  const year = inputDate.getFullYear()
  const month = String(inputDate.getMonth() + 1).padStart(2, '0') // Month is 0-based, so add 1
  const day = String(inputDate.getDate()).padStart(2, '0')

  // Create the formatted date string "YYYY-MM-DD"
  const formattedDate = `${year}-${month}-${day}`

  return formattedDate
}

export const formatEUDate = inputDateStr => {
  // Parse the input date string into a Date object
  const inputDate = new Date(inputDateStr)

  // Extract year, month, and day components
  const year = inputDate.getFullYear()
  const month = String(inputDate.getMonth() + 1).padStart(2, '0') // Month is 0-based, so add 1
  const day = String(inputDate.getDate()).padStart(2, '0')

  // Create the formatted date string "YYYY-MM-DD"
  const formattedDate = `${day}-${month}-${year}`

  return formattedDate
}

// Ultimo días
export const getLastDays = number => {
  const today = new Date()
  const dates = []

  for (let i = 0; i < number; i++) {
    const currentDate = new Date(today)
    currentDate.setDate(today.getDate() - i)
    dates.push(currentDate)
  }

  return dates
}

// Function para obtener el primer dia del mes
export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month - 1, 1) // Note: Month is 0-based index, so we subtract 1
}

// Function para obtener el ultimo dia del mes
// Function to get the last day of the current month
export const getLastDayOfMonth = (year, month) => {
  // Get the next month
  const lastDayOfMonth = new Date(year, month, 0)

  return lastDayOfMonth
}

// Funcion para obtener el nombre como 1 -30 de Abril de 2024 (Para Ausencias)
export const getMonthDateRangeText = (year, month, monthNames, translationOf) => {
  // Get the last day of the month
  const lastDayOfMonth = new Date(year, month, 0).getDate()

  // Format the text
  const text = `1 – ${lastDayOfMonth} ${translationOf} ${monthNames[month - 1]} ${translationOf} ${year}`

  return text
}

// Función para obtener el nombre entre fechas
export const getDateRangeText = (start, end, monthNames, translationOf) => {
  const startYear = start.getFullYear()
  const startMonth = start.getMonth() + 1 // Months are 0-indexed, so add 1
  const startDay = start.getDate()

  // Extract year, month, and day from the end date
  const endYear = end.getFullYear()
  const endMonth = end.getMonth() + 1 // Months are 0-indexed, so add 1
  const endDay = end.getDate()

  // Format the text
  const text = `${startDay} – ${endDay} ${translationOf} ${monthNames[startMonth - 1]} ${translationOf} ${startYear}`

  return text
}

export const createdAtToDatFormat = createdAt => {
  // Create a new Date object from the provided createdAt string
  const date = new Date(createdAt)

  // Extract the components of the date and time
  const day = date.getDate()
  const month = date.getMonth() + 1 // Month is zero-indexed, so we add 1
  const year = date.getFullYear() % 100 // Get the last two digits of the year
  const hours = date.getHours()
  const minutes = date.getMinutes()

  // Format the date and time components
  const formattedDate = `${day}/${month}/${year} ${hours}:${minutes.toString().padStart(2, '0')}`

  return formattedDate
}

export function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function getYearsFromNowTo2019() {
  const currentYear = new Date().getFullYear()

  return Array.from({ length: currentYear - 2019 + 1 }, (_, i) => currentYear - i)
}

export function timeStringToDate(time) {
  if (!time) return null
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return date
}
