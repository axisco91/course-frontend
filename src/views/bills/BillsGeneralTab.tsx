// BillsGeneralTab.tsx
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import React, { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, FormControlLabel, Grid, Switch, Typography, MenuItem } from '@mui/material'
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
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'

// ✅ Bills APIs
import { getBill, editBill } from 'src/api/api'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string; display_name?: string; course_display_name?: string; label?: string }

// ✅ bonus_statuses fijos
const bonus_statuses = [
  { value: 0, label: 'Pendiente' },
  { value: 1, label: 'Enviado' }
] as const

const getCourseLabel = (course: any) =>
  course?.display_name ?? course?.course_display_name ?? course?.label ?? course?.name ?? ''

const buildCourseLabel = (bill: any) => {
  const course = bill?.course
  if (typeof course === 'string') return course

  const trainingAction = course?.training_action ?? course?.trainingAction
  const trainingActionLabel = [trainingAction?.formative_action, course?.group].filter(Boolean).join(' / ')
  const trainingActionName = trainingAction?.name ?? ''

  return getCourseLabel(course) || [trainingActionLabel, trainingActionName].filter(Boolean).join(' ').trim()
}

type BonusStatusValue = (typeof bonus_statuses)[number]['value']

const toNumber = (value: number | string | null | undefined) => {
  if (value == null || value === '') return 0

  const parsed = Number(String(value).replace(',', '.'))

  return Number.isFinite(parsed) ? parsed : 0
}

const roundMoney = (value: number) => Math.round(value * 100) / 100

const getSalaryCostsPercentage = (numberStudents: number) => {
  if (numberStudents >= 6 && numberStudents <= 9) return 5
  if (numberStudents >= 10 && numberStudents <= 49) return 10
  if (numberStudents >= 50 && numberStudents <= 249) return 20
  if (numberStudents >= 250) return 50

  return 1
}

const getCalculationInputKey = (
  billing: number | string | null | undefined,
  bonus: number | string | null | undefined,
  numberStudents: number | string | null | undefined
) => [toNumber(billing), toNumber(bonus), toNumber(numberStudents)].join('|')

// ---- validation
const schema = (t: TranslationFunction) =>
  yup.object().shape({
    course: yup.mixed<List>().nullable().required(t('Course is required')),
    company: yup.mixed<List>().nullable().required(t('Company is required')),
    number_students: yup
      .number()
      .typeError(t('Number of students is required'))
      .min(0, t('Invalid value'))
      .required(t('Number of students is required')),
    billing: yup
      .number()
      .typeError(t('Billing is required'))
      .min(0, t('Invalid value'))
      .required(t('Billing is required')),
    bonus_status: yup.number().oneOf([0, 1]).required(t('Bonus status is required'))
  })

type FormValues = {

  // relations
  course: List | null
  company: List | null
  payment: List | null
  student: List | null
  advisor: List | null
  collaborator: List | null

  // ✅ bonus_status fijo (0/1)
  bonus_status: BonusStatusValue

  // numbers
  number_students: number | string
  billing: number | string
  bonus: number | string
  total_training_activity: number | string
  expenses: number | string
  salary_costs: number | string

  // strings
  billing_number: string
  observation: string

  // dates yyyy-mm-dd
  communication_start_date: string
  communication_end_date: string
  billing_date: string
  collection_date: string

  // booleans
  only_organizing_entity: boolean
  invoiced: boolean
  remitted: boolean
  charged: boolean
  is_bonus: boolean
  company_bonus: boolean
}

interface BillsGeneralTabProps {
  open: boolean
  mode: Mode
  billId: number | null
  onLoaded?: (bill: any) => void
  onClose?: () => void
}

const BillsGeneralTab: React.FC<BillsGeneralTabProps> = ({ open, mode, billId, onLoaded, onClose }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const userPermissions = useSelector((s: RootState) => s.auth.permissions) as string[]
  const canReadCourses =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.courses') || userPermissions.includes('read.management'))
  const canReadCompanies =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.companies') || userPermissions.includes('read.management'))
  const canReadAdvisors =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.advisors') || userPermissions.includes('read.management'))

  // ✅ LISTAS desde REDUX
  const courses = useSelector((s: RootState) => (s.course as any)?.courses ?? []) as List[]
  const companies = useSelector((s: RootState) => (s.company as any)?.companies ?? []) as List[]
  const payments = useSelector((s: RootState) => (s.payment as any)?.payments ?? []) as List[]
  const students = useSelector((s: RootState) => (s.student as any)?.students ?? []) as List[]
  const advisors = useSelector((s: RootState) => (s.advisor as any)?.advisors ?? []) as List[]
  const collaborators = useSelector((s: RootState) => (s.collaborator as any)?.collaborators ?? []) as List[]

  const coursesList = useMemo(() => (Array.isArray(courses) ? courses : []), [courses])
  const companiesList = useMemo(() => (Array.isArray(companies) ? companies : []), [companies])
  const paymentsList = useMemo(() => (Array.isArray(payments) ? payments : []), [payments])
  const studentsList = useMemo(() => (Array.isArray(students) ? students : []), [students])
  const advisorsList = useMemo(() => (Array.isArray(advisors) ? advisors : []), [advisors])
  const collaboratorsList = useMemo(() => (Array.isArray(collaborators) ? collaborators : []), [collaborators])

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [billCourseId, setBillCourseId] = useState<number | null>(null)
  const previousCalculationInputKey = useRef('')

  const defaultValues = useMemo<FormValues>(
    () => ({
      course: null,
      company: null,
      payment: null,
      student: null,
      advisor: null,
      collaborator: null,

      // ✅ por defecto Pendiente
      bonus_status: 0,

      number_students: 0,
      billing: '',
      bonus: 0,
      total_training_activity: 0,
      expenses: 0,
      salary_costs: 0,

      billing_number: '',
      observation: '',

      communication_start_date: '',
      communication_end_date: '',
      billing_date: '',
      collection_date: '',

      only_organizing_entity: false,
      invoiced: false,
      remitted: false,
      charged: false,
      is_bonus: false,
      company_bonus: false
    }),
    []
  )

  const {
    reset,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema(t)),
    shouldUnregister: false
  })

  const disabled = readOnly || loading || saving
  const courseDisabled = disabled || mode !== 'create'
  const isBonus = watch('is_bonus')
  const billingWatch = watch('billing')
  const bonusWatch = watch('bonus')
  const numberStudentsWatch = watch('number_students')

  const autoCompleteInputProps = (params: any) => ({
    ...params.inputProps,
    readOnly: disabled
  })

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

  const openAdvisorModal = (advisorId?: number | null) => {
    if (!advisorId || !canReadAdvisors) return
    dispatch(advisorActions.setId(Number(advisorId)))
    dispatch(advisorActions.openModal({ mode: 'view', advisorId: Number(advisorId) }))
  }

  const calculateBillAmounts = useCallback(() => {
    const bonus = toNumber(bonusWatch)
    if (bonus === 0) return

    const billing = toNumber(billingWatch)
    const numberStudents = toNumber(numberStudentsWatch)
    const totalActivity = roundMoney(bonus / 1.1)
    const percentage = getSalaryCostsPercentage(numberStudents)

    setValue('total_training_activity', totalActivity, { shouldDirty: true, shouldValidate: true })
    setValue('expenses', roundMoney(billing - totalActivity), { shouldDirty: true, shouldValidate: true })
    setValue('salary_costs', roundMoney((percentage / 100) * bonus), { shouldDirty: true, shouldValidate: true })
  }, [billingWatch, bonusWatch, numberStudentsWatch, setValue])

  useEffect(() => {
    if (!open) return
    if (disabled || !isBonus) return

    const inputKey = getCalculationInputKey(billingWatch, bonusWatch, numberStudentsWatch)
    if (inputKey === previousCalculationInputKey.current) return

    previousCalculationInputKey.current = inputKey
    calculateBillAmounts()
  }, [billingWatch, bonusWatch, calculateBillAmounts, disabled, isBonus, numberStudentsWatch, open])

  // ----------------------------
  // ✅ load bill on open (edit/view)
  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      previousCalculationInputKey.current = getCalculationInputKey(
        defaultValues.billing,
        defaultValues.bonus,
        defaultValues.number_students
      )
      setBillCourseId(null)
      setLoading(false)
      
	return
    }

    if (!billId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getBill(billId)
        if (cancelled) return

        const b = res.data?.data?.bill ?? res.data?.data ?? res.data?.bill ?? null
        if (!b) throw new Error('Bill payload not found')

        onLoaded?.(b)

        const pick = (list: List[], id: any) => (id != null ? list.find(x => x.id === Number(id)) ?? null : null)
        const courseId = b.course_id ?? (typeof b.course === 'object' ? b.course?.id : null)
        const courseValue =
          pick(coursesList, courseId) ??
          (courseId != null
            ? {
                id: Number(courseId),
                name: buildCourseLabel(b)
              }
            : null)

        setBillCourseId(courseValue?.id ?? null)
        previousCalculationInputKey.current = getCalculationInputKey(b.billing ?? '', b.bonus ?? 0, b.number_students ?? 0)

        reset({
          course: courseValue,
          company: pick(companiesList, b.company_id),
          payment: pick(paymentsList, b.payment_id),
          student: pick(studentsList, b.student_id),
          advisor: pick(advisorsList, b.advisor_id),
          collaborator: pick(collaboratorsList, b.collaborator_id),

          // ✅ si viene null => pendiente
          bonus_status: (Number(b.bonus_status ?? 0) === 1 ? 1 : 0) as BonusStatusValue,

          number_students: b.number_students ?? 0,
          billing: b.billing ?? '',
          bonus: b.bonus ?? 0,
          total_training_activity: b.total_training_activity ?? 0,
          expenses: b.expenses ?? 0,
          salary_costs: b.salary_costs ?? 0,

          billing_number: b.billing_number ?? '',
          observation: b.observation ?? '',

          communication_start_date: (b.communication_start_date ?? '').slice(0, 10),
          communication_end_date: (b.communication_end_date ?? '').slice(0, 10),
          billing_date: (b.billing_date ?? '').slice(0, 10),
          collection_date: (b.collection_date ?? '').slice(0, 10),

          only_organizing_entity: String(b.only_organizing_entity ?? '0') === '1',
          invoiced: String(b.invoiced ?? '0') === '1',
          remitted: String(b.remitted ?? '0') === '1',
          charged: String(b.charged ?? '0') === '1',
          is_bonus: String(b.is_bonus ?? '0') === '1',
          company_bonus: String(b.company_bonus ?? '0') === '1'
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
  }, [open, mode, billId])

  // ----------------------------
  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    if (!billId && mode !== 'create') return

    setSaving(true)
    try {
      const formData = new FormData()

      // ids
      formData.append('course_id', billCourseId != null ? String(billCourseId) : data.course?.id != null ? String(data.course.id) : '')
      formData.append('company_id', data.company?.id != null ? String(data.company.id) : '')
      formData.append('payment_id', data.payment?.id != null ? String(data.payment.id) : '')
      formData.append('student_id', data.student?.id != null ? String(data.student.id) : '')
      formData.append('advisor_id', data.advisor?.id != null ? String(data.advisor.id) : '')
      formData.append('collaborator_id', data.collaborator?.id != null ? String(data.collaborator.id) : '')

      // numbers
      formData.append('number_students', String(data.number_students ?? '0'))
      formData.append('billing', String(data.billing ?? '0'))
      formData.append('bonus', String(data.bonus ?? '0'))
      formData.append('total_training_activity', String(data.total_training_activity ?? '0'))
      formData.append('expenses', String(data.expenses ?? '0'))
      formData.append('salary_costs', String(data.salary_costs ?? '0'))

      // strings
      formData.append('billing_number', data.billing_number ?? '')
      formData.append('observation', data.observation ?? '')

      // dates
      formData.append('communication_start_date', data.communication_start_date ?? '')
      formData.append('communication_end_date', data.communication_end_date ?? '')
      formData.append('billing_date', data.billing_date ?? '')
      formData.append('collection_date', data.collection_date ?? '')

      // ✅ bonus_status fijo 0/1
      formData.append('bonus_status', String(data.bonus_status ?? 0))

      // booleans
      formData.append('only_organizing_entity', data.only_organizing_entity ? '1' : '0')
      formData.append('invoiced', data.invoiced ? '1' : '0')
      formData.append('remitted', data.remitted ? '1' : '0')
      formData.append('charged', data.charged ? '1' : '0')
      formData.append('is_bonus', data.is_bonus ? '1' : '0')
      formData.append('company_bonus', data.company_bonus ? '1' : '0')

      // ✅ SOLO UPDATE (según tu ejemplo)
      if (billId) {
        const response = await editBill(billId, formData)
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

  // ----------------------------
  return (
    <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Billing data')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* billing_number */}
          <Grid item xs={12} md={3}>
            <Controller
              name='billing_number'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Billing number')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          {/* course */}
          <Grid item xs={12} md={3}>
            <Controller
              name='course'
              control={control}
              render={({ field }) => (
	                <Autocomplete
	                  value={field.value}
	                  onChange={(_, v) => {
	                    if (courseDisabled) return
	                    field.onChange(v)
	                  }}
	                  options={coursesList}
	                  getOptionLabel={getCourseLabel}
	                  isOptionEqualToValue={(o, v) => o.id === v.id}
	                  disabled={courseDisabled}
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
	                      disabled={courseDisabled}
	                      inputProps={{ ...params.inputProps, readOnly: courseDisabled }}
	                      error={Boolean(errors.course)}
                      helperText={(errors.course as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* number_students */}
          <Grid item xs={12} md={3}>
            <Controller
              name='number_students'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Number of students')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.number_students)}
                  helperText={(errors.number_students as any)?.message}
                />
              )}
            />
          </Grid>

          {/* company */}
          <Grid item xs={12} md={3}>
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
                  disabled={disabled}
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
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.company)}
                      helperText={(errors.company as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* billing */}
          <Grid item xs={12} md={3}>
            <Controller
              name='billing'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Billing')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          {isBonus && (
            <Grid item xs={12} md={3}>
              <Controller
                name='bonus'
                control={control}
                render={({ field }) => (
                  <CustomTextField fullWidth type='number' label={t('Bonus')} {...field} disabled={disabled} />
                )}
              />
            </Grid>
          )}

          {isBonus && (
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'end' }}>
              <Button
                type='button'
                fullWidth
                variant='contained'
                onClick={calculateBillAmounts}
                disabled={disabled || toNumber(bonusWatch) === 0}
                startIcon={<Icon icon='tabler:calculator' />}
              >
                {t('Calculate')}
              </Button>
            </Grid>
          )}

          {isBonus && (
            <Grid item xs={12} md={3}>
              <Controller
                name='total_training_activity'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    type='number'
                    label={t('Total training activity')}
                    {...field}
                    disabled={disabled}
                  />
                )}
              />
            </Grid>
          )}

          {isBonus && (
            <Grid item xs={12} md={3}>
              <Controller
                name='expenses'
                control={control}
                render={({ field }) => (
                  <CustomTextField fullWidth type='number' label={t('Expenses')} {...field} disabled={disabled} />
                )}
              />
            </Grid>
          )}

          {isBonus && (
            <Grid item xs={12} md={3}>
              <Controller
                name='salary_costs'
                control={control}
                render={({ field }) => (
                  <CustomTextField fullWidth type='number' label={t('Salary costs')} {...field} disabled={disabled} />
                )}
              />
            </Grid>
          )}

          {isBonus && (
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <Controller
                name='company_bonus'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label={t('Company bonus')}
                    control={
                      <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                    }
                  />
                )}
              />
            </Grid>
          )}

          {isBonus && (
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <Controller
                name='only_organizing_entity'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label={t('Only organizing entity')}
                    control={
                      <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                    }
                  />
                )}
              />
            </Grid>
          )}

          {isBonus && (
            <Grid item xs={12} md={3}>
              <Controller
                name='bonus_status'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    label={t('Bonus status')}
                    {...field}
                    disabled={disabled}
                    error={Boolean(errors.bonus_status)}
                    helperText={(errors.bonus_status as any)?.message}
                  >
                    {bonus_statuses.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>
          )}

          {isBonus && (
            <Grid item xs={12} md={3}>
              <Controller
                name='communication_start_date'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    type='date'
                    label={t('Communication start')}
                    InputLabelProps={{ shrink: true }}
                    {...field}
                    disabled={disabled}
                  />
                )}
              />
            </Grid>
          )}

          {isBonus && (
            <Grid item xs={12} md={3}>
              <Controller
                name='communication_end_date'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    type='date'
                    label={t('Communication end')}
                    InputLabelProps={{ shrink: true }}
                    {...field}
                    disabled={disabled}
                  />
                )}
              />
            </Grid>
          )}

          {/* payment */}
          <Grid item xs={12} md={3}>
            <Controller
              name='payment'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={paymentsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Payment method')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='billing_date'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='date'
                  label={t('Billing date')}
                  InputLabelProps={{ shrink: true }}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='collection_date'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='date'
                  label={t('Collection date')}
                  InputLabelProps={{ shrink: true }}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='invoiced'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Invoiced')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='remitted'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Remitted')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='charged'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Charged')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>

          {/* advisor / collaborator */}
          <Grid item xs={12} md={6}>
            <Controller
              name='advisor'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={advisorsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component='span' sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                            {t('Advisor')}
                          </Typography>
                          {canReadAdvisors && field.value?.id ? (
                            <Box
                              role='button'
                              aria-label={t('View advisor')}
                              onMouseDown={e => e.preventDefault()}
                              onClick={e => {
                                e.stopPropagation()
                                openAdvisorModal(field.value?.id ?? null)
                              }}
                              sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                              <Icon icon='tabler:eye' fontSize={18} />
                            </Box>
                          ) : null}
                        </Box>
                      }
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='collaborator'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={collaboratorsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Collaborator')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* observation */}
          <Grid item xs={12}>
            <Controller
              name='observation'
              control={control as any}
              render={({ field }: any) => (
                <CustomTextField
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={6}
                  label={t('Observation')}
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

export default BillsGeneralTab
