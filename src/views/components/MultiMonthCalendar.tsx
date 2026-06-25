import React, { useEffect, useRef } from 'react'
import { Calendar } from '@fullcalendar/core'
import interactionPlugin from '@fullcalendar/interaction' // Import the interaction plugin
import multiMonthPlugin from '@fullcalendar/multimonth'

function MultiMonthCalendar() {
  const calendarRef = useRef(null)

  useEffect(() => {
    if (calendarRef.current) {
      const calendar = new Calendar(calendarRef.current, {
        plugins: [multiMonthPlugin, interactionPlugin], // Include the interaction plugin
        initialView: 'multiMonth',
        views: {
          multiMonth: {
            type: 'multiMonth',
            duration: { months: 12 } // Show 12 months
          }
        },
        events: [], // You can add events here if needed
        initialDate: '2023-01-01',
        visibleRange: {
          start: '2023-01-01',
          end: '2023-12-31'
        },
        height: 'auto', // Keep 'auto' to adjust height based on content
        eventContent: function (arg) {
          // Custom rendering for each event (day with a festival)
          const { event } = arg
          if (event.extendedProps.isFestival) {
            const element = document.createElement('div')
            element.innerText = event.title
            element.style.backgroundColor = 'red'
            element.style.color = 'white'

            return { domNodes: [element] }
          }
        }
      })

      calendar.render()

      // Use type assertion to inform TypeScript about the type of 'calendarEl'
      const calendarEl = calendarRef.current as HTMLElement
      calendarEl.addEventListener('click', function (e) {
        // Use the 'arg.date' property to get the clicked date
        const clickedDate = calendar.getDate()

        // Prompt user to add a festival for the clicked day
        const festivalName = prompt(`Add a festival for ${clickedDate.toISOString().split('T')[0]}:`)
        if (festivalName) {
          // Add the festival as an event
          calendar.addEvent({
            title: festivalName,
            start: clickedDate,
            isFestival: true // Custom property to identify festivals
          })
        }
      })
    }
  }, [])

  return <div ref={calendarRef}></div>
}

export default MultiMonthCalendar
