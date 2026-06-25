import { isSameDay } from 'date-fns'

export const validateSuggestedEntries = (entries, date, t) => {
  const errors = []
  const day = new Date()
  const sameDay = isSameDay(date, day) ? true : false

  // Ensure entries is not empty
  if (entries.length === 0) {
    errors.push(t('Entries cannot be empty'))
    
return { isValid: false, errors }
  }

  // Check the first entry
  if (entries[0].entry_motive.alias !== 'start_day') {
    errors.push(t('The first entry must be a start day'))
  }

  let lastEntry = ''

  // Check if there are any invalid motives or if there is a "Select motive" entry
  for (const entry of entries) {
    if (entry.entry_motive.id === 0 && entry.entry_motive.name === 'Select motive') {
      errors.push(t(`You need to select a motive`))
    }

    if (lastEntry === 'start_day' && entry.entry_motive.alias === 'resume_day') {
      errors.push(t(`You can't have a resume after a start`))
    }

    if (lastEntry === 'pause_day' && entry.entry_motive.alias !== 'resume_day') {
      errors.push(t(`You have to have a resume after a pause`))
    }

    if (lastEntry === 'resume_day' && entry.entry_motive.alias === 'start_day') {
      errors.push(t(`You can't have a start after a resume`))
    }

    if (lastEntry === 'end_day' && entry.entry_motive.alias !== 'start_day') {
      errors.push(t(`Only a start can go after an exit`))
    }

    if (!entry.hours) {
      errors.push(t(`Hour can't be empty`))
    }

    if (!entry.minutes) {
      errors.push(t(`Minutes can't be empty`))
    }

    if (!entry.seconds) {
      errors.push(t(`Seconds can't be empty`))
    }

    lastEntry = entry.entry_motive.alias
  }

  if (entries[entries.length - 1].entry_motive.alias !== 'end_day' && !sameDay) {
    errors.push(t('The last entry must be a exit'))
  }

  return { isValid: errors.length === 0, errors }
}

export const validateEntryReport = (automaticEntryReports, t) => {
  const errors = []

  for (const automaticEntryReport of automaticEntryReports) {
    const email = automaticEntryReport.email

    // Validate email: it must be empty or match a valid email pattern
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(t('You need a valid email'))
    }
  }
  
return { isValid: errors.length === 0, errors }
}
