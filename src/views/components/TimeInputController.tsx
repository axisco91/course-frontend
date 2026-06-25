import React, { useState } from 'react'
import { Controller } from 'react-hook-form'
import CustomTextField from 'src/@core/components/mui/text-field'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import { formatMinutesToHHMM } from 'src/context/timeFormats'

interface TimeInputControllerProps {
  name: string
  control: any
  label: string
  theme: any
  t: (key: string) => string
}

const TimeInputController: React.FC<TimeInputControllerProps> = ({ name, control, label, theme, t }) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: t('Este campo es obligatorio'),
        validate: value => {
          if (typeof value !== 'number' || isNaN(value) || value < 0) {
            return t('Formato de hora inválido (HH:MM)')
          }

          return true
        }
      }}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => {
        const [inputValue, setInputValue] = useState(formatMinutesToHHMM(value || 0))
        const [localError, setLocalError] = useState(false)

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setInputValue(e.target.value)
          setLocalError(false)
        }

        const validateAndSetTime = () => {
          const timeRegex = /^(\d{1,2}):?(\d{0,2})$/
          const match = inputValue.match(timeRegex)
          if (match) {
            const [_, newHours, newMinutes] = match
            const hours = parseInt(newHours || '0', 10)
            const minutes = parseInt(newMinutes || '0', 10)
            if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
              const totalMinutes = hours * 60 + minutes
              onChange(totalMinutes)
              setInputValue(formatMinutesToHHMM(totalMinutes))
              setLocalError(false)
            } else {
              setLocalError(true)
              onChange(undefined)
            }
          } else {
            setLocalError(true)
            onChange(undefined)
          }
          onBlur()
        }

        const incrementTime = () => {
          const newMinutes = (value || 0) + 1
          onChange(newMinutes)
          setInputValue(formatMinutesToHHMM(newMinutes))
          setLocalError(false)
        }

        const decrementTime = () => {
          const newMinutes = Math.max(0, (value || 0) - 1)
          onChange(newMinutes)
          setInputValue(formatMinutesToHHMM(newMinutes))
          setLocalError(false)
        }

        return (
          <CustomTextField
            fullWidth
            value={inputValue}
            onChange={handleInputChange}
            onBlur={validateAndSetTime}
            label={label}
            id={`input-${name}`}
            placeholder='8:30'
            error={localError || Boolean(error)}
            helperText={localError || error ? error?.message || t('Formato inválido (HH:MM)') : ''}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton
                    onMouseDown={e => e.preventDefault()}
                    aria-label='increase'
                    onClick={incrementTime}
                    style={{ color: theme.palette.primary.main }}
                  >
                    <Icon fontSize='1.25rem' icon='tabler:plus' />
                  </IconButton>
                </InputAdornment>
              ),
              startAdornment: (
                <InputAdornment position='start'>
                  <IconButton
                    aria-label='decrease'
                    onClick={decrementTime}
                    style={{ color: theme.palette.primary.main }}
                  >
                    <Icon fontSize='1.25rem' icon='tabler:minus' />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        )
      }}
    />
  )
}

export default TimeInputController
