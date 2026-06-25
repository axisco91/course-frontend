import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, Grid } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'

import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { festivalLabel } from 'src/utils/festivalLabel'

import { createPopulationFestival, editPopulationFestival } from 'src/api/api'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string; day?: string }

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    population: yup.mixed<List>().nullable().required(t('Population is required')),
    festival: yup.mixed<List>().nullable().required(t('Festival is required'))
  })

type FormValues = {
  population: List | null
  festival: List | null
  day: string
}

interface PopulationFestivalsGeneralTabProps {
  open: boolean
  mode: Mode
  populationFestivalId: number | null
  onClose?: () => void
}

const PopulationFestivalsGeneralTab: React.FC<PopulationFestivalsGeneralTabProps> = ({
  open,
  mode,
  populationFestivalId,
  onClose
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const populations = useSelector((state: RootState) => (state as any).population?.populations ?? []) as List[]
  const festivals = useSelector((state: RootState) => (state as any).nacionalFestival?.nacionalFestivals ?? []) as List[]
  const current = useSelector(
    (state: RootState) => (state as any).populationFestival?.currentPopulationFestival ?? null
  ) as any

  const populationsList = useMemo(() => (Array.isArray(populations) ? populations : []), [populations])
  const festivalsList = useMemo(() => (Array.isArray(festivals) ? festivals : []), [festivals])

  const defaultValues = useMemo<FormValues>(
    () => ({
      population: null,
      festival: null,
      day: ''
    }),
    []
  )

  const {
    reset,
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema(t)),
    shouldUnregister: false
  })

  const festivalWatch = watch('festival')

  useEffect(() => {
    const day = String((festivalWatch as any)?.day ?? '').slice(0, 10)
    setValue('day', day)
  }, [festivalWatch, setValue])

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!populationFestivalId) return

    setLoading(true)

    const item = current ?? {}
    const populationId = item.population_id ?? item.population?.id ?? null
    const festivalId = item.festival_id ?? item.nacional_festival_id ?? item.festival?.id ?? item.nacional_festival?.id ?? null

    const selectedPopulation =
      populationId != null ? populationsList.find(c => Number(c.id) === Number(populationId)) ?? null : null
    const selectedFestival =
      festivalId != null ? festivalsList.find(f => Number(f.id) === Number(festivalId)) ?? null : null

    reset({
      population: selectedPopulation,
      festival: selectedFestival,
      day: String(item.day ?? item.festival?.day ?? item.nacional_festival?.day ?? selectedFestival?.day ?? '').slice(0, 10)
    })

    setLoading(false)
  }, [open, mode, populationFestivalId, current, populationsList, festivalsList, reset, defaultValues])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('population_id', data.population?.id != null ? String(data.population.id) : '')

      const festivalId = data.festival?.id != null ? String(data.festival.id) : ''
      formData.append('festival_id', festivalId)
      formData.append('nacional_festival_id', festivalId)

      if (mode === 'create') {
        const response = await createPopulationFestival(formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
          onClose?.()
        }
      } else if (mode === 'edit' && populationFestivalId) {
        const response = await editPopulationFestival(populationFestivalId, formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
        }
      }
    } catch (error) {
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={6}>
            <Controller
              name='population'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={populationsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                  disabled={readOnly || loading || saving}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Population')}
                      error={Boolean(errors.population)}
                      helperText={(errors.population as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='festival'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={festivalsList}
                  getOptionLabel={festivalLabel}
                  isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                  disabled={readOnly || loading || saving}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Festival')}
                      error={Boolean(errors.festival)}
                      helperText={(errors.festival as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='day'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='date'
                  label={t('Day')}
                  InputLabelProps={{ shrink: true }}
                  {...field}
                  disabled
                />
              )}
            />
          </Grid>
        </Grid>

        {mode !== 'view' && (
          <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', gap: 3 }}>
            <Button variant='contained' type='submit' disabled={saving || loading}>
              <Icon icon='tabler:device-floppy' fontSize={20} />
              {t('Save')}
            </Button>

            <Button variant='tonal' color='secondary' onClick={onClose} disabled={saving}>
              <Icon icon='tabler:x' fontSize={20} />
              {t('Cancel')}
            </Button>
          </Box>
        )}
      </form>

      {!saving && loading && <SavingDialog labelKey='Processing Data' />}

      {saving && <SavingDialog />}
    </Fragment>
  )
}

export default PopulationFestivalsGeneralTab
