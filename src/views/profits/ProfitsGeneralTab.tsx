// ProfitsGeneralTab.tsx
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Box, Button, Grid, Typography } from '@mui/material'
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
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'

// ✅ APIs
import { getProfit, editProfit } from 'src/api/api'

type List = { id: number; name: string } // UI canonical
type Mode = 'view' | 'edit' | 'create'

type FormValues = {
  course: List | null
  company: List | null
  student: List | null

  number_students: number | string

  price: number | string
  license: number | string
  teacher: number | string
  management: number | string
  nebrija_title: number | string
  discount: number | string

  collaborator_percentage: number | string
  collaborator_commission: number | string

  advisor_percentage: number | string
  advisor_commission: number | string

  total: number | string
  benefits: number | string

  observations: string
}

interface ProfitsGeneralTabProps {
  open: boolean
  mode: Mode
  profitId: number | null
  onLoaded?: (p: any) => void
  onClose?: () => void
}

const toNum = (v: any) => {
  if (v === '' || v === null || v === undefined) return 0
  const n = Number(String(v).replace(',', '.'))
  
return Number.isFinite(n) ? n : 0
}
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// ✅ normaliza listas que vengan como {value,label} (antigua) o {id,name} (nueva)
const normalizeList = (arr: any[]): List[] => {
  if (!Array.isArray(arr)) return []
  
return arr
    .map((x: any) => {
      if (x?.id != null) return { id: Number(x.id), name: String(x.name ?? x.label ?? '') }
      if (x?.value != null) return { id: Number(x.value), name: String(x.label ?? x.name ?? '') }
      
return null
    })
    .filter(Boolean) as List[]
}

const pick = (list: List[], idOrValue: any) => {
  if (idOrValue == null) return null
  const id = Number(idOrValue)
  
return list.find(x => x.id === id) ?? null
}

const ProfitsGeneralTab: React.FC<ProfitsGeneralTabProps> = ({ open, mode, profitId, onLoaded, onClose }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canReadCourses =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.courses') || userPermissions.includes('read.management'))
  const canReadCompanies =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.companies') || userPermissions.includes('read.management'))

  // ✅ LISTAS desde REDUX (pueden venir {value,label} o {id,name})
  const coursesRaw = useSelector((s: RootState) => (s.course as any)?.courses ?? []) as any[]
  const companiesRaw = useSelector((s: RootState) => (s.company as any)?.companies ?? []) as any[]
  const studentsRaw = useSelector((s: RootState) => (s.student as any)?.students ?? []) as any[]

  const coursesList = useMemo(() => normalizeList(coursesRaw), [coursesRaw])
  const companiesList = useMemo(() => normalizeList(companiesRaw), [companiesRaw])
  const studentsList = useMemo(() => normalizeList(studentsRaw), [studentsRaw])

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const readOnly = mode === 'view'

  // label dinámico como tu antigua
  const labelNebrija = useMemo(() => {
    const host = typeof window !== 'undefined' ? window.location.host : ''
    
return host === 'zona.avzformacion.com' ? 'Titulo Nebrija' : 'Otros Gastos'
  }, [])

  const defaultValues = useMemo<FormValues>(
    () => ({
      course: null,
      company: null,
      student: null,

      number_students: 0,

      price: '',
      license: 0,
      teacher: 0,
      management: 0,
      nebrija_title: 0,
      discount: 0,

      collaborator_percentage: '',
      collaborator_commission: 0,

      advisor_percentage: '',
      advisor_commission: 0,

      total: 0,
      benefits: 0,

      observations: ''
    }),
    []
  )

  const schema = useMemo(
    () =>
      yup.object().shape({
        price: yup.number().typeError(t('Invalid value')).min(0, t('Invalid value')),
        collaborator_percentage: yup.number().typeError(t('Invalid value')).min(0).max(100),
        advisor_percentage: yup.number().typeError(t('Invalid value')).min(0).max(100)
      }),
    [t]
  )

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false
  })

  const disabledUi = readOnly || loading || saving

  const openCourseModal = (courseId?: number | null) => {
    if (!courseId || !canReadCourses) return
    dispatch(courseActions.setId(Number(courseId)))
    dispatch(courseActions.openModal({ mode: 'view', courseId: Number(courseId) }))
  }

  const openCompanyModal = (companyId?: number | null) => {
    if (!companyId || !canReadCompanies) return
    dispatch(companyActions.setId(Number(companyId)))
    dispatch(companyActions.openModal({ mode: 'view', companyId: Number(companyId) }))
  }

  // ----------------------------
  // ✅ load profit on open
  useEffect(() => {
    if (!open) return
    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!profitId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getProfit(profitId)
        if (cancelled) return

        const p = res.data?.data?.profit ?? res.data?.data ?? res.data?.profit ?? null
        if (!p) throw new Error('Profit payload not found')

        onLoaded?.(p)

        reset({
          course: pick(coursesList, p.course_id),
          company: pick(companiesList, p.company_id),
          student: pick(studentsList, p.student_id),

          number_students: p.number_students ?? 0,

          price: p.price ?? '',
          license: p.license ?? 0,
          teacher: p.teacher ?? 0,
          management: p.management ?? 0,
          nebrija_title: p.nebrija_title ?? 0,
          discount: p.discount ?? 0,

          collaborator_percentage: p.collaborator_percentage ?? '',
          collaborator_commission: p.collaborator_commission ?? 0,

          advisor_percentage: p.advisor_percentage ?? '',
          advisor_commission: p.advisor_commission ?? 0,

          total: p.total ?? 0,
          benefits: p.benefits ?? 0,

          observations: p.observations ?? ''
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
  }, [open, mode, profitId])

  // ----------------------------
  // ✅ CÁLCULOS (replica lógica antigua)
  const priceW = watch('price')
  const teacherW = watch('teacher')
  const managementW = watch('management')
  const nebrijaW = watch('nebrija_title')
  const discountW = watch('discount')
  const collPercW = watch('collaborator_percentage')
  const advPercW = watch('advisor_percentage')

  useEffect(() => {
    if (!open) return

    const price = toNum(priceW)
    const teacher = toNum(teacherW)
    const management = toNum(managementW)
    const nebrija = toNum(nebrijaW)
    const discount = toNum(discountW)
    const collPerc = toNum(collPercW)
    const advPerc = toNum(advPercW)

    const collCom = round2((collPerc / 100) * price)
    const advCom = round2((advPerc / 100) * price)

    // ✅ total = SUMA COSTES (en tu antigua NO suma license)
    const total = round2(teacher + management + nebrija + discount + collCom + advCom)
    const benefits = round2(price - total)

    setValue('collaborator_commission', collCom, { shouldValidate: false, shouldDirty: false })
    setValue('advisor_commission', advCom, { shouldValidate: false, shouldDirty: false })
    setValue('total', total, { shouldValidate: false, shouldDirty: false })
    setValue('benefits', benefits, { shouldValidate: false, shouldDirty: false })
  }, [open, priceW, teacherW, managementW, nebrijaW, discountW, collPercW, advPercW, setValue])

  // ----------------------------
  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    if (!profitId) return

    setSaving(true)
    try {
      const formData = new FormData()

      // ✅ ids (aunque estén disabled en UI, los mandamos)
      formData.append('course_id', data.course?.id != null ? String(data.course.id) : '')
      formData.append('company_id', data.company?.id != null ? String(data.company.id) : '')
      formData.append('student_id', data.student?.id != null ? String(data.student.id) : '')

      formData.append('number_students', String(data.number_students ?? '0'))

      // editables (como la antigua)
      formData.append('price', String(toNum(data.price)))
      formData.append('license', String(toNum(data.license)))
      formData.append('teacher', String(toNum(data.teacher)))
      formData.append('management', String(toNum(data.management)))
      formData.append('nebrija_title', String(toNum(data.nebrija_title)))
      formData.append('discount', String(toNum(data.discount)))

      formData.append('collaborator_percentage', String(toNum(data.collaborator_percentage)))
      formData.append('advisor_percentage', String(toNum(data.advisor_percentage)))

      // calculados (disabled pero se guardan)
      formData.append('collaborator_commission', String(toNum(data.collaborator_commission)))
      formData.append('advisor_commission', String(toNum(data.advisor_commission)))
      formData.append('total', String(toNum(data.total)))
      formData.append('benefits', String(toNum(data.benefits)))

      formData.append('observations', data.observations ?? '')

      const response = await editProfit(profitId, formData)
      if (response.data?.success) {
        toast.success(response.data.message ?? t('Saved'))
        dispatch(generalActions.addFilterButtonClickCount())
      }
    } catch (error) {
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  // ----------------------------
  return (
    <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Course data')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* Curso (SIEMPRE disabled) */}
          <Grid item xs={12} md={4}>
            <Controller
              name='course'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={coursesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component='span' sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                            {t('Course')}
                          </Typography>
                          {canReadCourses && field.value?.id ? (
                            <Box
                              role='button'
                              aria-label={t('View course')}
                              onMouseDown={e => e.preventDefault()}
                              onClick={e => {
                                e.stopPropagation()
                                openCourseModal(field.value?.id ?? null)
                              }}
                              sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                              <Icon icon='tabler:eye' fontSize={18} />
                            </Box>
                          ) : null}
                        </Box>
                      }
                      disabled
                      inputProps={{ ...params.inputProps, readOnly: true }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Empresa (SIEMPRE disabled) */}
          <Grid item xs={12} md={4}>
            <Controller
              name='company'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={companiesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component='span' sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                            {t('Company')}
                          </Typography>
                          {canReadCompanies && field.value?.id ? (
                            <Box
                              role='button'
                              aria-label={t('View company')}
                              onMouseDown={e => e.preventDefault()}
                              onClick={e => {
                                e.stopPropagation()
                                openCompanyModal(field.value?.id ?? null)
                              }}
                              sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                              <Icon icon='tabler:eye' fontSize={18} />
                            </Box>
                          ) : null}
                        </Box>
                      }
                      disabled
                      inputProps={{ ...params.inputProps, readOnly: true }}
                    />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 10, mb: 6 }}>
          <Typography variant='h6'>{t('Costs')}</Typography>
        </Box>

        <Grid container spacing={5}>
          <Grid item xs={12} md={2}>
            <Controller
              name='price'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Price')}
                  {...field}
                  disabled={disabledUi}
                  error={Boolean(errors.price)}
                  helperText={(errors.price as any)?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Controller
              name='license'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('License')} {...field} disabled={disabledUi} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Controller
              name='teacher'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Teacher')} {...field} disabled={disabledUi} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Controller
              name='management'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Management')} {...field} disabled={disabledUi} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Controller
              name='nebrija_title'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={labelNebrija} {...field} disabled={disabledUi} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Controller
              name='discount'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Discount')} {...field} disabled={disabledUi} />
              )}
            />
          </Grid>

          {/* % Colaborador / Comisión Colaborador */}
          <Grid item xs={12} md={3}>
            <Controller
              name='collaborator_percentage'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Collaborator percentage')}
                  {...field}
                  disabled={disabledUi}
                  error={Boolean(errors.collaborator_percentage)}
                  helperText={(errors.collaborator_percentage as any)?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='collaborator_commission'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Collaborator commission')} {...field} disabled />
              )}
            />
          </Grid>

          {/* % Asesoría / Comisión Asesoría */}
          <Grid item xs={12} md={3}>
            <Controller
              name='advisor_percentage'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Advisor percentage')}
                  {...field}
                  disabled={disabledUi}
                  error={Boolean(errors.advisor_percentage)}
                  helperText={(errors.advisor_percentage as any)?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='advisor_commission'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Advisor commission')} {...field} disabled />
              )}
            />
          </Grid>

          {/* Total / Beneficios */}
          <Grid item xs={12} md={6}>
            <Controller
              name='total'
              control={control}
              render={({ field }) => <CustomTextField fullWidth type='number' label={t('Total')} {...field} disabled />}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='benefits'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Benefits')} {...field} disabled />
              )}
            />
          </Grid>

          {/* Observaciones */}
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
                  label={t('Observation')}
                  {...field}
                  value={field.value ?? ''}
                  disabled={disabledUi}
                />
              )}
            />
          </Grid>
        </Grid>

        {mode !== 'view' ? (
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
        ) : null}
      </form>

      {!saving && loading && <SavingDialog labelKey='Processing Data' />}

      {saving && <SavingDialog />}
    </Fragment>
  )
}

export default ProfitsGeneralTab
