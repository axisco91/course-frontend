import React, { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Box, Button, FormControlLabel, Grid, Switch, Typography } from '@mui/material'
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

import { createMainCompany, editMainCompany, getMainCompany } from 'src/api/api'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string

const isActiveValue = (value: any) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1

  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()

  return normalized === '1' || normalized === 'true' || normalized === 'active' || normalized === 'activo'
}

const schema = (t: TranslationFunction, isCreate: boolean) =>
  yup.object().shape({
    name: yup.string().trim().required(t('Name is required')),
    email: yup.string().trim().nullable().email(t('Invalid email')),
    password: isCreate
      ? yup.string().trim().min(6, t('Minimum 6 characters')).required(t('Password is required'))
      : yup.string().trim().nullable(),
    title: yup.string().trim().nullable()
  })

type FormValues = {
  name: string
  address: string
  phone: string
  email: string
  password: string
  url: string
  logo: File | null
  title: string
  primary_color: string
  secondary_color: string
  success_color: string
  warning_color: string
  error_color: string
  active: boolean
}

interface MainCompaniesGeneralTabProps {
  open: boolean
  mode: Mode
  mainCompanyId: number | null
  onLoaded?: (company: any) => void
  onClose?: () => void
}

const MainCompaniesGeneralTab: React.FC<MainCompaniesGeneralTabProps> = ({
  open,
  mode,
  mainCompanyId,
  onLoaded,
  onClose
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const isCreate = mode === 'create'
  const readOnly = mode === 'view'

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      address: '',
      phone: '',
      email: '',
      password: '',
      url: '',
      logo: null,
      title: '',
      primary_color: '#7367F0',
      secondary_color: '#A8AAAE',
      success_color: '#28C76F',
      warning_color: '#FF9F43',
      error_color: '#EA5455',
      active: true
    }),
    []
  )

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema(t, isCreate)),
    shouldUnregister: false
  })

  const disabled = readOnly || saving || loading

  const onPickLogo = useCallback(
    (file: File | null) => {
      setValue('logo', file)

      if (!file) {
        setLogoPreview('')

        return
      }

      const reader = new FileReader()
      reader.onload = () => setLogoPreview(String(reader.result ?? ''))
      reader.readAsDataURL(file)
    },
    [setValue]
  )

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLogoPreview('')
      setLoading(false)

      return
    }

    if (!mainCompanyId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getMainCompany(mainCompanyId)
        if (cancelled) return

        const c = res.data?.data?.main_company ?? res.data?.data ?? res.data?.main_company ?? null
        if (!c) throw new Error('Main company payload not found')

        onLoaded?.(c)

        const incomingLogo = c.logo != null ? String(c.logo) : ''
        setLogoPreview(incomingLogo)

        reset({
          name: c.name ?? '',
          address: c.address ?? '',
          phone: c.phone ?? c.telephone ?? '',
          email: c.email ?? '',
          password: '',
          url: c.url ?? '',
          logo: null,
          title: c.title ?? '',
          primary_color: c.primary_color ?? '#7367F0',
          secondary_color: c.secondary_color ?? '#A8AAAE',
          success_color: c.success_color ?? '#28C76F',
          warning_color: c.warning_color ?? '#FF9F43',
          error_color: c.error_color ?? '#EA5455',
          active: isActiveValue(c.active ?? c.status ?? 1)
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
  }, [open, mode, mainCompanyId])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    setSaving(true)

    try {
      const formData = new FormData()

      formData.append('name', data.name ?? '')
      formData.append('address', data.address ?? '')
      formData.append('phone', data.phone ?? '')
      formData.append('email', data.email ?? '')
      formData.append('url', data.url ?? '')
      formData.append('title', data.title ?? '')

      formData.append('primary_color', data.primary_color ?? '')
      formData.append('secondary_color', data.secondary_color ?? '')
      formData.append('success_color', data.success_color ?? '')
      formData.append('warning_color', data.warning_color ?? '')
      formData.append('error_color', data.error_color ?? '')

      formData.append('active', data.active ? '1' : '0')

      if (isCreate || String(data.password ?? '').trim()) {
        formData.append('password', data.password ?? '')
      }

      if (data.logo) {
        formData.append('logo', data.logo)
      }

      const response = isCreate
        ? await createMainCompany(formData)
        : mainCompanyId
        ? await editMainCompany(mainCompanyId, formData)
        : null

      const success = Boolean(response?.data?.success) || response?.status === 200

      if (success) {
        toast.success(response?.data?.message ?? t('Saved'))
        dispatch(generalActions.addFilterButtonClickCount())
        onClose?.()
      } else {
        toast.error(response?.data?.message ?? t('Unable to save'))
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
          <Grid item xs={12} md={4}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Name')}
                  placeholder={t('Name')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message as any}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='title'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Title')}
                  placeholder={t('Title')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.title)}
                  helperText={errors.title?.message as any}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Email')}
                  placeholder={t('Email')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message as any}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='phone'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Telephone')}
                  placeholder={t('Telephone')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='url'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Url')} placeholder={t('Url')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='password'
                  label={t('Password')}
                  placeholder={t('Password')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message as any}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name='address'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Address')}
                  placeholder={t('Address')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant='body2' sx={{ mb: 2 }}>
              {t('Logo')}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: theme => `1px solid ${theme.palette.divider}`
                }}
              >
                <img
                  src={logoPreview || '/images/logos/logo_icon.png'}
                  alt='logo-preview'
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button component='label' variant='contained' disabled={disabled}>
                  {t('Upload')}
                  <input hidden type='file' accept='image/*' onChange={e => onPickLogo(e.target.files?.[0] ?? null)} />
                </Button>

                <Button
                  variant='outlined'
                  color='secondary'
                  disabled={disabled}
                  onClick={() => {
                    onPickLogo(null)
                  }}
                >
                  {t('Reset')}
                </Button>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='active'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Active')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, checked) => field.onChange(checked)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant='h6'>{t('Colors')}</Typography>
          </Grid>

          <Grid item xs={12} md={2}>
            <Controller
              name='primary_color'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='color' label={t('Primary color')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Controller
              name='secondary_color'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='color' label={t('Secondary color')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Controller
              name='success_color'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='color' label={t('Success color')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Controller
              name='warning_color'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='color' label={t('Warning color')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Controller
              name='error_color'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='color' label={t('Error color')} {...field} disabled={disabled} />
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

export default MainCompaniesGeneralTab
