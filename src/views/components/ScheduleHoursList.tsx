import React, { forwardRef } from 'react'
import { Box, IconButton, Grid } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { ScheduleHour } from 'src/reducers/types/scheduleTypes'
import DatePicker from 'react-datepicker'
import CustomTextField from './CustomTextField'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'

// Define interface for the CustomInput props
interface CustomInputProps {
  value?: string
  label: string
  onClick?: () => void
}

// CustomInput component using forwardRef
const CustomInput = forwardRef(({ label, ...props }: CustomInputProps, ref) => {
  return <CustomTextField fullWidth inputRef={ref} label={label} {...props} sx={{ width: '100%' }} />
})

// Define props for the ScheduleHoursList
interface ScheduleHoursListProps {
  scheduleHour: ScheduleHour // Single schedule object
  index: number
  updateSchedule: (day: number, index: number, field: string, value: any) => void
  deleteSchedule: (id: number | null, index: number) => void
}

// Main component
const ScheduleHoursList: React.FC<ScheduleHoursListProps> = ({
  scheduleHour,
  index,
  updateSchedule,
  deleteSchedule
}) => {
  const { t, i18n } = useTranslation()

  const handleInputChange = (field: string, value: any) => {
    const formattedTime = value ? format(value, 'HH:mm') : ''
    updateSchedule(scheduleHour.day, index, field, formattedTime)
  }

  const timeStringToDate = (time: string) => {
    if (!time) return null
    const [hours, minutes] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    
return date
  }

  return (
    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
      <Grid container spacing={5}>
        {/* Start Time Field */}
        <Grid item xs={12} sm={5}>
          <DatePicker
            showTimeSelect
            selected={timeStringToDate(scheduleHour.start)}
            timeIntervals={15}
            showTimeSelectOnly
            dateFormat='HH:mm'
            id='time-only-picker'
            onChange={(date: Date) => handleInputChange('start', date)}
            customInput={<CustomInput label={t('Start')} />}
            calendarStartDay={1}
            locale={i18n.language}
            showMonthDropdown
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={15}
          />
        </Grid>
        {/* End Time Field */}
        <Grid item xs={12} sm={5}>
          <DatePicker
            showTimeSelect
            selected={timeStringToDate(scheduleHour.end)}
            timeIntervals={15}
            showTimeSelectOnly
            dateFormat='HH:mm'
            id='time-only-picker'
            onChange={(date: Date) => handleInputChange('end', date)}
            customInput={<CustomInput label={t('End')} />}
            calendarStartDay={1}
            locale={i18n.language}
            showMonthDropdown
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={15}
          />
        </Grid>
        {/* Delete Button */}
        <Grid item xs={12} sm={2}>
          <IconButton onClick={() => deleteSchedule(index, scheduleHour.day)}>
            <Icon icon='tabler:trash' fontSize={20} />
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ScheduleHoursList
