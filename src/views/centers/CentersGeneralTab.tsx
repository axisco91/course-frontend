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
import { createCenter, editCenter, getCenter } from 'src/api/api'

import { centerActions } from 'src/reducers/centers/CenterReducer'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    name: yup.string().nullable().required(t('Name is required')),
    address: yup.string().nullable().default(''),
    email: yup.string().nullable().email(t('Email inválido')).default(''),
    telephone: yup.string().nullable().default('')
  })

type FormValues = {
  name: string
  address: string
  email: string
  telephone: string
}

interface CenterGeneralTabProps {
  open: boolean
  mode: Mode
  centerId: number | null
  onLoaded?: (center: any) => void
  onClose?: () => void
}

const CentersGeneralTab: React.FC<CenterGeneralTabProps> = ({ open, mode, centerId, onLoaded, onClose }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      address: '',
      email: '',
      telephone: ''
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
    shouldUnregister: false
  })

  // ----------------------------
  // load center (edit/view)
  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!centerId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getCenter(centerId)
        if (cancelled) return

        const c = res.data?.data?.center ?? null
        if (!c) throw new Error('Center payload not found')

        onLoaded?.(c)

        reset({
          name: c.name ?? '',
          address: c.address ?? '',
          email: c.email ?? '',
          telephone: c.telephone ?? c.phone ?? ''
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
  }, [open, mode, centerId])

  // ----------------------------
  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('name', data.name ?? '')
      formData.append('address', data.address ?? '')
      formData.append('email', data.email ?? '')
      formData.append('telephone', data.telephone ?? '')

      if (mode === 'create') {
        const response = await createCenter(formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())

          const newId = response.data?.data?.center?.id ?? response.data?.data?.id
          if (newId) {
            if (centerActions?.setId) dispatch(centerActions.setId(Number(newId)))
            if (centerActions?.openModal) {
              dispatch(centerActions.openModal({ mode: 'edit', centerId: Number(newId) }))
            }
          }
        } else {
          toast.error(response.data?.message ?? t('No se pudo guardar'))
        }
      } else if (mode === 'edit' && centerId) {
        const response = await editCenter(centerId, formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
        } else {
          toast.error(response.data?.message ?? t('No se pudo guardar'))
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
              name='name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Name')}
                  {...field}
                  disabled={loading || saving || readOnly}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message as any}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='telephone'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Telephone')}
                  {...field}
                  disabled={loading || saving || readOnly}
                  error={Boolean(errors.telephone)}
                  helperText={errors.telephone?.message as any}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Email')}
                  {...field}
                  disabled={loading || saving || readOnly}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message as any}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='address'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Address')}
                  {...field}
                  disabled={loading || saving || readOnly}
                  error={Boolean(errors.address)}
                  helperText={errors.address?.message as any}
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

export default CentersGeneralTab
