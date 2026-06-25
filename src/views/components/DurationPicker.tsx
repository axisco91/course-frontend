import React from 'react'
import { Box, Grid, TextField, Slider, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import CustomTextField from './CustomTextField'

interface DurationPickerProps {
  label?: string
  minutes: number
  onChange: (minutes: number) => void
  maxHours?: number
}

const DurationPicker: React.FC<DurationPickerProps> = ({ label = 'Duration', minutes, onChange, maxHours = 12 }) => {
  const { t } = useTranslation()
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = parseInt(e.target.value) || 0
    onChange(newHours * 60 + mins)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMins = parseInt(e.target.value) || 0
    onChange(hours * 60 + newMins)
  }

  const handleSliderChange = (_: Event, value: number | number[]) => {
    onChange((value as number) * 60 + mins)
  }

  return (
    <Box>
      {label && <Typography sx={{ mb: 2 }}>{label}</Typography>}

      <Grid container spacing={2} alignItems='center'>
        <Grid item xs={6}>
          <CustomTextField
            type='number'
            label={t('Hours')}
            value={hours}
            onChange={handleHoursChange}
            inputProps={{ min: 0, max: maxHours }}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <CustomTextField
            type='number'
            label={t('Minutes')}
            value={mins}
            onChange={handleMinutesChange}
            inputProps={{ min: 0, max: 59 }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <Slider
            value={hours}
            min={0}
            max={maxHours}
            step={1}
            onChange={handleSliderChange}
            valueLabelDisplay='auto'
            valueLabelFormat={v => `${v}h`}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default DurationPicker
