import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, Grid, Switch, Typography, FormControlLabel } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'
import { createTeacher, editTeacher, getTeacher, teacherCheckDni } from 'src/api/api'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string }

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    name: yup.string().trim().required(t('Name is required')),
    surname: yup.string().trim().required(t('Surname is required')),

    dni: yup.string().trim().required(t('DNI is required')),
    telephone: yup.string().trim().required(t('Telephone is required')),

    email: yup.string().trim().email(t('Invalid email')).required(t('Email is required')),

    user: yup.string().trim().required(t('User is required')),
    password: yup.string().trim().required(t('Password is required'))
  })

type FormValues = {
  name: string
  surname: string
  dni?: string
  teacher_areas: List[] // ✅ MULTI
  telephone?: string
  email?: string
  user?: string
  password?: string
  address?: string
  population?: string
  post_code?: string
  province: List | null
  iban: string
  active: boolean
  observations: string
}

interface TeachersGeneralTabProps {
  open: boolean
  mode: Mode
  teacherId: number | null
  onLoaded?: (teacher: any) => void
  onClose?: () => void
}

const TeachersGeneralTab: React.FC<TeachersGeneralTabProps> = ({ open, mode, teacherId, onLoaded, onClose }) => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  const provinces = useSelector((state: RootState) => state.province.provinces) as List[]
  const provincesList = useMemo(() => (Array.isArray(provinces) ? provinces : []), [provinces])

  const teacherAreas = useSelector((state: RootState) => state.teacherArea.teacherAreas) as List[]
  const teacherAreasList = useMemo(() => (Array.isArray(teacherAreas) ? teacherAreas : []), [teacherAreas])

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      surname: '',
      dni: '',
      teacher_areas: [], // ✅ MULTI
      telephone: '',
      email: '',
      user: '',
      password: '',
      address: '',
      population: '',
      post_code: '',
      province: null,
      iban: '',
      active: true,
      observations: ''
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
    resolver: yupResolver(schema(t))
  })

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!teacherId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getTeacher(teacherId)
        if (cancelled) return

        const s = res.data?.data?.teacher ?? res.data?.data ?? res.data?.teacher ?? null
        if (!s) throw new Error('Teacher payload not found')

        onLoaded?.(s) // ✅ FIX

        const provinceIdFromApi =
          s.province_id ?? s.provinceId ?? (typeof s.province === 'object' ? s.province?.id : null)

        const selectedProvince =
          provinceIdFromApi != null ? provincesList.find(p => p.id === Number(provinceIdFromApi)) ?? null : null

        // ✅ MULTI: puede venir como teacher_areas o teacherAreas
        const areasFromApi: any[] = Array.isArray(s.teacher_areas)
          ? s.teacher_areas
          : Array.isArray(s.teacherAreas)
          ? s.teacherAreas
          : []

        const selectedAreas: List[] = areasFromApi
          .map(a => {
            const id = a?.id ?? a?.teacher_area_id ?? a?.teacherAreaId
            if (id == null) return null

            return teacherAreasList.find(x => x.id === Number(id)) ?? null
          })
          .filter(Boolean) as List[]

        const activeBool = String(s.active ?? '1') === '1'

        reset({
          name: s.name ?? '',
          surname: s.surname ?? '',
          dni: s.dni ?? '',
          teacher_areas: selectedAreas, // ✅ MULTI
          telephone: s.telephone ?? '',
          email: s.email ?? '',
          user: s.user ?? '',
          password: s.password ?? '',
          address: s.address ?? '',
          population: s.population ?? '',
          post_code: s.post_code ?? '',
          province: selectedProvince,
          iban: s.iban ?? '',
          active: activeBool,
          observations: s.observations ?? ''
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
  }, [open, mode, teacherId, provincesList, teacherAreasList, reset, defaultValues])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return

    // ✅ 1) Check DNI antes de guardar
    try {
      const dni = (data.dni ?? '').trim()

      if (dni.length > 0) {
        // 🔧 si tu endpoint espera params en GET:
        const check = await teacherCheckDni({ dni: dni, id: teacherId ? String(teacherId) : '' })

        if (check.data?.exists) {
          toast.error(t('DNI ya en uso'))

          return // 🔴 corta aquí (no guarda)
        }
      }
    } catch (error) {
      // si falla el check, mejor bloquear para evitar duplicados
      handleError(error, logout)

      return
    }

    // ✅ 2) Guardado normal
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', (data.name ?? '').trim())
      formData.append('surname', (data.surname ?? '').trim())
      formData.append('dni', (data.dni ?? '').trim())
      formData.append('telephone', (data.telephone ?? '').trim())
      formData.append('email', (data.email ?? '').trim())
      formData.append('user', (data.user ?? '').trim())
      formData.append('password', (data.password ?? '').trim())

      formData.append('address', data.address ?? '')
      formData.append('population', data.population ?? '')
      formData.append('post_code', data.post_code ?? '')
      formData.append('iban', data.iban ?? '')
      formData.append('observations', data.observations ?? '')

      formData.append('province_id', data.province?.id != null ? String(data.province.id) : '')
      formData.append('active', data.active ? '1' : '0')

      // ✅ MULTI: teacher_areas[]
      ;(data.teacher_areas ?? []).forEach(a => {
        if (a?.id != null) formData.append('teacher_areas[]', String(a.id))
      })

      if (mode === 'create') {
        const response = await createTeacher(formData)
        if (response.data?.success) {
          toast.success(response.data.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())

          const newId = response.data?.data?.teacher?.id ?? response.data?.data?.id
          if (newId) {
            dispatch(teacherActions.setId(newId))
            dispatch(teacherActions.openModal({ mode: 'edit', teacherId: newId }))
          }
        }
      } else if (mode === 'edit' && teacherId) {
        const response = await editTeacher(teacherId, formData)
        if (response.data?.success) {
          toast.success(response.data.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
        }
      }
    } catch (error) {
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  const disabled = readOnly || loading || saving

  const autoCompleteInputProps = (params: any) => ({
    ...params.inputProps,
    readOnly: disabled
  })

  return (
    <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Teacher data')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* NAME */}
          <Grid item xs={12} md={3}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Name')}
                  placeholder={t('Name')}
                  {...field}
                  InputProps={{ readOnly }}
                  disabled={disabled}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>

          {/* SURNAME */}
          <Grid item xs={12} md={3}>
            <Controller
              name='surname'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Surname')}
                  placeholder={t('Surname')}
                  {...field}
                  InputProps={{ readOnly }}
                  disabled={disabled}
                  error={Boolean(errors.surname)}
                  helperText={errors.surname?.message}
                />
              )}
            />
          </Grid>

          {/* DNI */}
          <Grid item xs={12} md={3}>
            <Controller
              name='dni'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Nif')}
                  placeholder={t('Nif')}
                  {...field}
                  InputProps={{ readOnly }}
                  disabled={disabled}
                  error={Boolean(errors.dni)}
                  helperText={errors.dni?.message}
                />
              )}
            />
          </Grid>

          {/* AREAS (MULTI) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='teacher_areas'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  value={field.value}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  options={teacherAreasList}
                  getOptionLabel={option => option?.name ?? ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Areas')}
                      placeholder={t('Areas')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* TELEPHONE */}
          <Grid item xs={12} md={3}>
            <Controller
              name='telephone'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Telephone')}
                  placeholder={t('Telephone')}
                  {...field}
                  InputProps={{ readOnly }}
                  disabled={disabled}
                  error={Boolean(errors.telephone)}
                  helperText={errors.telephone?.message}
                />
              )}
            />
          </Grid>

          {/* EMAIL */}
          <Grid item xs={12} md={3}>
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
                  helperText={errors.email?.message}
                />
              )}
            />
          </Grid>

          {/* USER */}
          <Grid item xs={12} md={3}>
            <Controller
              name='user'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('User')}
                  placeholder={t('User')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.user)}
                  helperText={errors.user?.message}
                />
              )}
            />
          </Grid>

          {/* PASSWORD */}
          <Grid item xs={12} md={3}>
            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Password')}
                  placeholder={t('Password')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 6, mt: 6 }}>
          <Typography variant='h6'>{t('Other data')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* PROVINCE */}
          <Grid item xs={12} md={3}>
            <Controller
              name='province'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  options={provincesList}
                  getOptionLabel={option => option?.name ?? ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Province')}
                      placeholder={t('Province')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* ADDRESS */}
          <Grid item xs={12} md={3}>
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

          {/* POPULATION */}
          <Grid item xs={12} md={3}>
            <Controller
              name='population'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Population')}
                  placeholder={t('Population')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          {/* POST CODE */}
          <Grid item xs={12} md={3}>
            <Controller
              name='post_code'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Post Code')}
                  placeholder={t('Post Code')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          {/* IBAN */}
          <Grid item xs={12} md={3}>
            <Controller
              name='iban'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Iban')} placeholder={t('Iban')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          {/* ACTIVE */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
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

          {/* OBSERVATIONS */}
          <Grid item xs={12}>
            <Controller
              name='observations'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={6}
                  label={t('Observations')}
                  placeholder={t('Observations')}
                  {...field}
                  value={field.value ?? ''}
                  disabled={disabled}
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

export default TeachersGeneralTab
