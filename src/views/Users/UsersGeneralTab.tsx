import React, { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, Grid, Switch, Typography, FormControlLabel } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { useTranslation } from 'react-i18next'

import SavingDialog from 'src/views/components/SavingDialog'

// 🔧 Ajusta a tu api real
import { getUser, createUser, editUser } from 'src/api/api'

// 🔧 Ajusta a tu reducer real
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { userActions } from 'src/reducers/users/UserReducer'

type Mode = 'view' | 'edit' | 'create'
type ListOpt = { id: number; name: string; surname?: string }
type TranslationFn = (k: string) => string

type FormValues = {
  name: string
  surname: string
  email: string
  username: string
  password?: string
  role: ListOpt | null
  teacher: ListOpt | null
  has_commission: boolean
  commission: number | string
  active: boolean
  imageFile: File | null
}

const schema = (t: TranslationFn, isCreate: boolean) =>
  yup.object().shape({
    name: yup.string().trim().required(t('Nombre requerido')),
    surname: yup.string().trim().required(t('Apellidos requeridos')),
    email: yup.string().trim().email(t('Email inválido')).required(t('Email requerido')),
    username: yup.string().trim().required(t('Usuario requerido')),
    password: isCreate
      ? yup.string().trim().min(6, t('Mínimo 6')).required(t('Contraseña requerida'))
      : yup.string().trim().optional()
  })

interface Props {
  open: boolean
  mode: Mode
  userId: number | null
  onLoaded?: (u: any) => void
}

const UsersGeneralTab: React.FC<Props> = ({ open, mode, userId, onLoaded }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // refs para evitar deps inestables
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  const onLoadedRef = useRef(onLoaded)

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  const isCreate = mode === 'create'

  const rolesRaw = useSelector((s: RootState) => (s as any).role?.roles ?? []) as any[]
  const teachersRaw = useSelector((s: RootState) => (s as any).teacher?.teachers ?? []) as any[]

  const roles: ListOpt[] = useMemo(
    () =>
      Array.isArray(rolesRaw)
        ? rolesRaw.map((r: any) => ({ id: Number(r.value ?? r.id), name: String(r.label ?? r.name ?? '') }))
        : [],
    [rolesRaw]
  )

  const teachers: ListOpt[] = useMemo(
    () =>
      Array.isArray(teachersRaw)
        ? teachersRaw.map((t: any) => ({
            id: Number(t.value ?? t.id),
            name: String(t.label ?? t.name ?? ''),
            surname: t.surname != null ? String(t.surname) : undefined
          }))
        : [],
    [teachersRaw]
  )

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      surname: '',
      email: '',
      username: '',
      password: '',
      role: null,
      teacher: null,
      has_commission: false,
      commission: '',
      active: true,
      imageFile: null
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
    resolver: yupResolver(schema(t, isCreate))
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // preview avatar
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  // guardamos el user cargado para NO refetchear cuando cambien roles/teachers
  const [loadedUser, setLoadedUser] = useState<any | null>(null)

  // 1) Fetch user SOLO con open/isCreate/userId
  useEffect(() => {
    if (!open) return

    if (isCreate) {
      setLoadedUser(null)
      reset(defaultValues)
      setAvatarPreview('')
      setLoading(false)

      return
    }

    if (!userId) return

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await getUser(userId)
        if (cancelled) return
        const u = res.data?.data?.user ?? res.data?.data ?? res.data?.user ?? null
        if (!u) throw new Error(t('User payload not found'))

        setLoadedUser(u)
        onLoadedRef.current?.(u)

        const avatarUrl = u.profile_photo_path ?? u.avatar ?? ''
        setAvatarPreview(avatarUrl ? String(avatarUrl) : '')
      } catch (e) {
        if (!cancelled) handleErrorRef.current(e, logoutRef.current)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, isCreate, userId, reset, defaultValues])

  // 2) Reset del form cuando ya tenemos user + cuando roles/teachers estén listos
  useEffect(() => {
    if (!open) return
    if (isCreate) return
    if (!loadedUser) return

    const u = loadedUser

    const roleId = Number(u.role_id ?? u.roleId)
    const teacherId = Number(u.teacher_id ?? u.teacherId)

    reset({
      name: u.name ?? '',
      surname: u.surname ?? '',
      email: u.email ?? '',
      username: u.username ?? '',
      password: '',
      role: roleId ? roles.find(x => x.id === roleId) ?? null : null,
      teacher: teacherId ? teachers.find(x => x.id === teacherId) ?? null : null,
      has_commission: String(u.has_commission ?? 0) === '1' || Boolean(u.has_commission),
      commission: u.commission ?? '',
      active: String(u.active ?? 1) === '1' || Boolean(u.active),
      imageFile: null
    })
  }, [open, isCreate, loadedUser, roles, teachers, reset])

  // subir fichero
  const onPickImage = useCallback(
    (file: File | null) => {
      setValue('imageFile', file)
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => setAvatarPreview(String(reader.result ?? ''))
      reader.readAsDataURL(file)
    },
    [setValue]
  )

  const onSubmit: SubmitHandler<FormValues> = async data => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', (data.name ?? '').trim())
      formData.append('surname', (data.surname ?? '').trim())
      formData.append('email', (data.email ?? '').trim())
      formData.append('username', (data.username ?? '').trim())

      if (isCreate) formData.append('password', (data.password ?? '').trim())

      formData.append('has_commission', data.has_commission ? '1' : '0')
      formData.append('commission', String(data.commission ?? ''))
      formData.append('active', data.active ? '1' : '0')

      formData.append('roles', data.role?.id != null ? String(data.role.id) : '')
      formData.append('teacher_id', data.teacher?.id != null ? String(data.teacher.id) : '')

      if (data.imageFile) formData.append('image', data.imageFile)

      const res = isCreate ? await createUser(formData) : userId ? await editUser(userId, formData) : null
      if (!res || res.status !== 200) {
        toast.error(res?.data?.message ?? t('No se pudo guardar'))

        return
      }

      const saved = res.data?.data?.user ?? res.data?.user ?? res.data?.data
      toast.success(t('User saved'))

      dispatch(generalActions.addFilterButtonClickCount())

      // ✅ IMPORTANTE: en EDIT NO actualizamos loadedUser con "saved"
      // porque muchas APIs devuelven payload parcial y el effect de reset borra inputs.

      if (isCreate) {
        const newId = Number(saved?.id)
        if (newId) {
          dispatch(userActions.setId(newId))
          dispatch(userActions.openModal({ mode: 'edit', userId: newId }))
        }
      }
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setSaving(false)
    }
  }

  const disabled = loading || saving || mode === 'view'

  return (
    <Fragment>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Avatar + botones */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 6 }}>
          <Box
            sx={{
              width: 110,
              height: 110,
              borderRadius: 2,
              overflow: 'hidden',
              border: theme => `1px solid ${theme.palette.divider}`
            }}
          >
            <img
              src={avatarPreview || '/images/avatars/avatar.png'}
              alt='avatar'
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button component='label' variant='contained' disabled={disabled} sx={{ width: 140 }}>
              {t('Upload New Photo')}
              <input hidden type='file' accept='image/*' onChange={e => onPickImage(e.target.files?.[0] ?? null)} />
            </Button>

            <Button
              variant='outlined'
              color='secondary'
              disabled={disabled}
              onClick={() => {
                setAvatarPreview('/images/avatars/avatar.png')
                setValue('imageFile', null)
              }}
              sx={{ width: 140 }}
            >
              {t('Reset')}
            </Button>

            <Typography variant='body2' color='text.secondary'>
              {t('Allowed JPG, GIF or PNG. Maximum size 800kB')}
            </Typography>
          </Box>
        </Box>

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
              name='surname'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Surnames')}
                  placeholder={t('Surnames')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.surname)}
                  helperText={errors.surname?.message as any}
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
                  placeholder='correo@email.com'
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
              name='username'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('User')}
                  placeholder={t('User')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.username)}
                  helperText={errors.username?.message as any}
                />
              )}
            />
          </Grid>

          {isCreate ? (
            <Grid item xs={12} md={4}>
              <Controller
                name='password'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label={t('Password')}
                    placeholder={t('Password')}
                    type='password'
                    {...field}
                    disabled={disabled}
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message as any}
                  />
                )}
              />
            </Grid>
          ) : (
            <Grid item xs={12} md={4} />
          )}

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='has_commission'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Has commissions')}
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={(_, checked) => field.onChange(checked)}
                      disabled={disabled}
                    />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='role'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={roles}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => <CustomTextField {...params} label={t('Role')} placeholder={t('Select...')} />}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='teacher'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={teachers}
                  getOptionLabel={o => (o?.surname ? `${o.name} ${o.surname}` : o?.name ?? '')}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField {...params} label={t('Teacher')} placeholder={t('Select...')} />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='commission'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Commission')}
                  placeholder={t('Commission')}
                  type='number'
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='active'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Active')}
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={(_, checked) => field.onChange(checked)}
                      disabled={disabled}
                    />
                  }
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
          <Button variant='contained' type='submit' disabled={saving || loading || mode === 'view'}>
            <Icon icon='tabler:device-floppy' fontSize={20} />
            {t('Save')}
          </Button>
        </Box>
      </form>

      {!saving && loading && <SavingDialog labelKey='Processing Data' />}

      {saving && <SavingDialog />}
    </Fragment>
  )
}

export default UsersGeneralTab
