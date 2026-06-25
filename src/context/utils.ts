// useDynamicHeight.ts

import { useState, useEffect } from 'react'
import { addDays } from 'date-fns'

export const useDynamicHeight = () => {
  const [height, setHeight] = useState<number>()

  useEffect(() => {
    const updateHeight = () => {
      const viewportHeight = window.innerHeight
      setHeight(viewportHeight * 0.8) // Adjust the multiplier as needed
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)

    return () => {
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return height ? height - 170 : undefined
}

export const useDynamicHeightBigComponents = () => {
  const [height, setHeight] = useState<number>()

  useEffect(() => {
    const updateHeight = () => {
      const viewportHeight = window.innerHeight
      setHeight(viewportHeight * 0.8) // Adjust the multiplier as needed
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)

    return () => {
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return height ? height - 170 : undefined
}

// Genera un array desde el inicio hasta el fin dado
export const generateDates = (start: Date, end: Date) => {
  const dates = []
  for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
    dates.push(date)
  }

  return dates
}
