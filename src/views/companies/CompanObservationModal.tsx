import React, { useContext, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormHelperText,
  Grid,
  IconButton,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'

import { createCompanyObservation, editCompanyObservation, getCompanyObservation } from 'src/api/api'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useDispatch } from 'react-redux'

type Mode = 'create' | 'edit'
type TranslationFunction = (key: string) => string

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    observation: yup.string().required(t('Observation is required'))
  })

type FormValues = {
  observation: string
}

interface CompanyObservationModalProps {
  open: boolean
  mode: Mode
  companyId: number
  observationId?: number | null
  onClose: () => void
  onSaved?: () => void
}

const CompanyObservationModal: React.FC<CompanyObservationModalProps> = ({
  open,
  mode,
  companyId,
  observationId = null,
  onClose,
  onSaved
}) => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(() => ({ observation: '' }), [])

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema(t))
  })

  useEffect(() => {
    if (!open) return

    // create -> limpio
    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    // edit -> cargo
    if (!observationId) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await getCompanyObservation(observationId)
        if (cancelled) return

        const data = res.data?.data
        const obs = data?.company_observation ?? data ?? null
        const text = obs?.company_observation ?? obs?.observation ?? obs?.note ?? ''

        reset({ observation: String(text ?? '') })
      } catch (e) {
        if (!cancelled) handleError(e, logout)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [open, mode, observationId, reset, defaultValues])

  const onSubmit: SubmitHandler<FormValues> = async data => {
    if (!open) return
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('company_id', String(companyId))
      formData.append('observation', data.observation)

      if (mode === 'create') {
        const r = await createCompanyObservation(formData)
        if (r.data?.success) toast.success(r.data?.message ?? t('Saved'))
      } else {
        if (!observationId) return
        const r = await editCompanyObservation(observationId, formData)
        if (r.data?.success) toast.success(r.data?.message ?? t('Saved'))
      }

      // ✅ ahora sí
      dispatch(generalActions.addFilterButtonClickCount())

      // ✅ refresca tabla y cierra
      onSaved?.()
      onClose()
    } catch (e) {
      handleError(e, logout)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth='sm'
      onClose={() => {
        if (saving) return
        onClose()
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          {mode === 'create' ? t('New observation') : t('Edit observation')}
        </Typography>

        <IconButton
          onClick={() => {
            if (saving) return
            onClose()
          }}
        >
          <Icon icon='tabler:x' fontSize={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* 👇 OJO: ya NO hay <form onSubmit=...> */}
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Controller
              name='observation'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  multiline
                  minRows={5}
                  label={t('Observation')}
                  placeholder={t('Write here...')}
                  {...field}
                  disabled={loading || saving}
                  error={Boolean(errors.observation)}
                />
              )}
            />
            {errors.observation && <FormHelperText error>{String(errors.observation.message ?? '')}</FormHelperText>}
          </Grid>
        </Grid>

        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Button
            variant='contained'
            type='button'
            disabled={loading || saving}
            onClick={handleSubmit(onSubmit)} // ✅ SOLO aquí se guarda
          >
            <Icon icon='tabler:device-floppy' fontSize={20} />
            {t('Save')}
          </Button>

          <Button variant='tonal' color='secondary' type='button' disabled={loading || saving} onClick={onClose}>
            <Icon icon='tabler:x' fontSize={20} />
            {t('Cancel')}
          </Button>
        </Box>

        {!saving && loading && <SavingDialog labelKey='Processing Data' />}

        {saving && <SavingDialog />}
      </DialogContent>
    </Dialog>
  )
}

export default CompanyObservationModal
