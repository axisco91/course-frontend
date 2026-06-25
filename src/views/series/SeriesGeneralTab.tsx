// LiquidationsGeneralTab.tsx
import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Box, Button, Grid } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'

import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'

import { useDispatch } from 'react-redux'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// ✅ APIs
import { createTrainingContractSeries, editTrainingContractSeries, getTrainingContractSerie } from 'src/api/api'
import { trainingContractSerieActions } from 'src/reducers/trainingContracts/TrainingContractSerieReducer'

// ✅ reducer

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    series: yup.string().nullable().required(t('Series is required')),
    description: yup.string().nullable()
  })

type FormValues = {
  series: string
  description: string
}

interface SeriesGeneralTabProps {
  open: boolean
  mode: Mode
  serieId: number | null
  onLoaded?: (liquidation: any) => void
  onClose?: () => void
}

const SeriesGeneralTab: React.FC<SeriesGeneralTabProps> = ({ open, mode, serieId, onLoaded, onClose }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      series: '',
      description: ''
    }),
    []
  )

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema(t)),
    shouldUnregister: false // ✅ CLAVE: aunque estén disabled/si cambias render, no se pierden
  })

  // ----------------------------
  // load liquidation (edit/view)
  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!serieId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getTrainingContractSerie(serieId)
        if (cancelled) return

        const l = res.data?.data?.training_contract_series ?? null
        if (!l) throw new Error('Serie payload not found')

        onLoaded?.(l)

        reset({
          series: l.series ?? l.name ?? '',
          description: l.description ?? ''
        })
      } catch (error) {
        if (!cancelled) handleError(error, logout)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, serieId])

  // ----------------------------
  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    setSaving(true)

    try {
      const formData = new FormData()

      // ✅ editables
      formData.append('series', data.series ?? '')
      formData.append('description', data.description ?? '')

      if (mode === 'create') {
        const response = await createTrainingContractSeries(formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())

          const newId = response.data?.data?.training_contract_series?.id ?? response.data?.data?.id
          if (newId) {
            if (trainingContractSerieActions?.setId) dispatch(trainingContractSerieActions.setId(Number(newId)))
            if (trainingContractSerieActions?.openModal) {
              dispatch(trainingContractSerieActions.openModal({ mode: 'edit', serieId: Number(newId) }))
            }
          }
        }
      } else if (mode === 'edit' && serieId) {
        const response = await editTrainingContractSeries(serieId, formData)
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
              name='series'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Series')}
                  {...field}
                  error={Boolean(errors.series)}
                  helperText={(errors.series as any)?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='description'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Description')}
                  {...field}
                  error={Boolean(errors.description)}
                  helperText={(errors.description as any)?.message}
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

export default SeriesGeneralTab
