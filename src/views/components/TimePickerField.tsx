import React from 'react'
import CustomTextField from 'src/@core/components/mui/text-field'

interface TimePickerFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  step?: number
}

const TimePickerField: React.FC<TimePickerFieldProps> = ({ label, value, onChange, step = 900 }) => {
  return (
    <CustomTextField
      type='time'
      label={label}
      value={value}
      onChange={e => {
        const inputValue = e.target.value // Ej: '08:45'
        if (/^\d{2}:\d{2}$/.test(inputValue)) {
          onChange(inputValue)
        }
      }}
      inputProps={{
        step, // por defecto 900s = 15 minutos
        pattern: '[0-9]{2}:[0-9]{2}'
      }}
      fullWidth
    />
  )
}

export default TimePickerField
