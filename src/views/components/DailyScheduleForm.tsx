// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

// ** Third Party Imports
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { SubmitHandler, Controller, useForm } from 'react-hook-form'
import DatePicker from 'react-datepicker'
import { format } from 'date-fns'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'

// ** Icon Imports
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Styled Components
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

// ** Llamadas API
import { storeCenterScheduleHour, updateCenterScheduleHour } from 'src/api/api'
import { useRouter } from 'next/router'
import { CardContent, CardHeader } from '@mui/material'

import { useDispatch } from 'react-redux'
import CustomInput from './PickersCustomInput'
import { centerScheduleHourActions } from 'src/reducers/centers/CenterScheduleHourReducer'

// Para controlar los validations
const schema = () => {
  return yup.object().shape({})
}

const DailyScheduleForm = () => {
  // Para el idioma
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const dispatch = useDispatch()
  const { centerId } = router.query

  // Obtenemos en usuario que esta logeado
  const scheduleHour = useSelector((state: RootState) => state.centerScheduleHour.scheduleHour)
  const scheduleId = useSelector((state: RootState) => state.centerSchedule.id)
  const day = useSelector((state: RootState) => state.centerScheduleHour.day)
  const id = useSelector((state: RootState) => state.centerScheduleHour.id)

  // Controlar para que solo puede pinchar en el botón de guardar una vez para que no se cree datos duplicado
  const [saving, setSaving] = useState<boolean>(false)

  // Añadía una hora solo a la hora asi que he hecho esto para que no se añada
  let initialStart
  if (scheduleHour && scheduleHour.start) {
    initialStart = new Date(`2000-01-01T${scheduleHour.start}.000Z`)
    initialStart.setHours(initialStart.getHours() - 1) // Subtract 1 hour
  } else {
    initialStart = new Date()
  }
  let initialEnd
  const [start, setStart] = useState<DateType>(initialStart)
  if (scheduleHour && scheduleHour.end) {
    initialEnd = new Date(`2000-01-01T${scheduleHour.end}.000Z`)
    initialEnd.setHours(initialEnd.getHours() - 1) // Subtract 1 hour
  } else {
    initialEnd = new Date()
  }
  const [end, setEnd] = useState<DateType>(initialEnd)
  const activeCompanyId = useSelector((state: RootState) => state.activeCompany.id)

  let dayName = ''
  if (day === 1) {
    dayName = t('Monday')
  } else if (day === 2) {
    dayName = t('Tuesday')
  } else if (day === 3) {
    dayName = t('Wednesday')
  } else if (day === 4) {
    dayName = t('Thursday')
  } else if (day === 5) {
    dayName = t('Friday')
  } else if (day === 6) {
    dayName = t('Saturday')
  } else if (day === 7) {
    dayName = t('Sunday')
  }

  // ** Hooks
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({ resolver: yupResolver(schema()) })

  // Realizamos el metodo de guardar
  const onFormSubmit: SubmitHandler<any> = () => {
    setSaving(true)

    // Creamos el formData y añadimos los elementos
    const formData = new FormData()
    formData.append('company_id', activeCompanyId ? activeCompanyId.toString() : '')
    formData.append('center_id', centerId ? centerId.toString() : '')
    formData.append('center_schedule_id', scheduleId ? scheduleId.toString() : '')
    formData.append('start', start ? format(start, 'HH:mm:ss') : '')
    formData.append('end', end ? format(end, 'HH:mm:ss') : '')
    formData.append('day', day ? day.toString() : '')
    if (!id) {
      storeCenterScheduleHour(formData)
        .then(response => {
          // Vemos si nos da un success y lo indicamos
          if (response.data.success) {
            toast.success(response.data.message)
            dispatch(centerScheduleHourActions.addCenterScheduleHour(response.data.data.center_schedule_hour))
            dispatch(centerScheduleHourActions.setDay(null))
            dispatch(centerScheduleHourActions.setId(null))
            dispatch(centerScheduleHourActions.setShowForm(false))
            setSaving(false)
          }
        })
        .catch(error => {
          setSaving(false)
          console.error(error)
          if (error.response) {
            if (error.response.data.errors) {
              console.error(error.response.data.errors)
            } else {
              console.error('Network Error:', error.response.data.message)
              const errorMessage = error.response.data.message
              toast.error(errorMessage, {
                position: 'top-right'
              })
            }
          } else {
            // Handle network error (e.g., no response from the server)
            console.error('Network Error:', error.message)
            const errorMessage = t('Error with server try again later')
            toast.error(errorMessage, {
              position: 'top-right'
            })
          }
        })
    } else {
      updateCenterScheduleHour(id, formData)
        .then(response => {
          // Vemos si nos da un success y lo indicamos
          setSaving(false)
          if (response.data.success) {
            toast.success(response.data.message)
            dispatch(centerScheduleHourActions.replaceCenterScheduleHour(response.data.data.center_schedule_hour))
            dispatch(centerScheduleHourActions.setDay(null))
            dispatch(centerScheduleHourActions.setId(null))
            dispatch(centerScheduleHourActions.setShowForm(false))
          }
        })
        .catch(error => {
          setSaving(false)
          if (error.response) {
            if (error.response.data.errors) {
              console.error(error.response.data.errors)
            } else {
              console.error('Network Error:', error.response.data.message)
              const errorMessage = error.response.data.message
              toast.error(errorMessage, {
                position: 'top-right'
              })
            }
          } else {
            // Handle network error (e.g., no response from the server)
            console.error('Network Error:', error.message)
            const errorMessage = t('Error with server try again later')
            toast.error(errorMessage, {
              position: 'top-right'
            })
          }
        })
    }
  }

  return (
    <DatePickerWrapper>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <CardHeader title={dayName}></CardHeader>
        <CardContent>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={3}>
              <Controller
                name='start'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker
                    showTimeSelect
                    selected={start}
                    timeIntervals={15}
                    showTimeSelectOnly
                    dateFormat='HH:mm'
                    id='time-only-picker'
                    onChange={(date: Date) => setStart(date)}
                    customInput={<CustomInput label={t('Start')} />}
                    calendarStartDay={1}
                    locale={i18n.language}
                    showMonthDropdown
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name='end'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker
                    showTimeSelect
                    selected={end}
                    timeIntervals={15}
                    showTimeSelectOnly
                    dateFormat='HH:mm'
                    id='time-only-picker'
                    onChange={(date: Date) => setEnd(date)}
                    customInput={<CustomInput label={t('End')} />}
                    calendarStartDay={1}
                    locale={i18n.language}
                    showMonthDropdown
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                  />
                )}
              />
            </Grid>
            <Grid
              item
              xs={12}
              sx={{ pt: theme => `${theme.spacing(6.5)} !important`, display: 'flex', justifyContent: 'flex-end' }}
            >
              <Button variant='contained' type='submit' sx={{ mr: 4 }} disabled={saving}>
                {t('Save')}
              </Button>
              <Button
                variant='contained'
                color='secondary'
                sx={{ mr: 4 }}
                onClick={() => {
                  dispatch(centerScheduleHourActions.setDay(null))
                  dispatch(centerScheduleHourActions.setId(null))
                  dispatch(centerScheduleHourActions.setShowForm(false))
                }}
              >
                {t('Close')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </form>
    </DatePickerWrapper>
  )
}

export default DailyScheduleForm
