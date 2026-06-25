// TracingsGeneralTab.tsx
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import React, { Fragment, forwardRef, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, FormControlLabel, Grid, MenuItem, Switch, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import { es, enUS } from 'date-fns/locale'
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
import { studentActions } from 'src/reducers/students/StudentReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'

// ✅ APIs (renombra a tus exports reales)
import { getTracing, editTracing } from 'src/api/api'

type Mode = 'view' | 'edit' | 'create'
type List = { id: number; name: string }

const toInputDate = (value: unknown) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10)

  const dashMatch = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (dashMatch) return `${dashMatch[3]}-${dashMatch[2]}-${dashMatch[1]}`

  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`

  return raw.slice(0, 10)
}

const toApiDate = (value: unknown) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`

  return raw
}

const toDisplayDate = (value: unknown) => toApiDate(toInputDate(value))
const datePickerLocale = (lng: string) => (lng?.startsWith('es') ? es : enUS)

const parseDatePickerValue = (value: unknown) => {
  const raw = toInputDate(value)
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))

  return Number.isNaN(date.getTime()) ? null : date
}

const toDatePickerValue = (date: Date | null) => {
  if (!date || Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const tracingResultOptions = [
  { value: 0, label: 'Pendiente' },
  { value: 1, label: 'Realizado' },
  { value: 2, label: 'No realizado' }
]

// Igual que en el formulario antiguo: sin validaciones obligatorias aquí.
const schema = yup.object().shape({})

type FormValues = {

  // relations
  course: List | null
  company: List | null
  student: any | null
  training_contract_element: List | null

  // header readonly fields
  student_name: string
  student_surname: string

  // progress numbers
  performed_activities: number | string
  total_activities: number | string
  performed_units: number | string
  total_units: number | string
  performed_hours: number | string
  total_hours: number | string
  last_connection: string

  // follow-up dates (BASE - NO edit)
  welcome_date: string
  quarter_date: string
  half_date: string
  three_quarters_date: string
  final_date: string

  // sent dates (EDIT)
  welcome_date_sent: string
  quarter_date_sent: string
  half_date_sent: string
  three_quarters_date_sent: string
  final_date_sent: string

  // toggles (EDIT)
  welcome_message: boolean
  quarter_message: boolean
  half_message: boolean
  three_quarters_message: boolean
  final_message: boolean

  // other
  follow_up_date: string
  final_test: number | string
  questionnaire: number | string
  observation: string
}

interface TracingsGeneralTabProps {
  open: boolean
  mode: Mode
  tracingId: number | null
  onLoaded?: (tr: any) => void
  onClose?: () => void
}

type DateInputProps = {
  value?: string
  onClick?: () => void
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  label: string
  disabled?: boolean
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { value, onClick, onChange, onBlur, label, disabled },
  ref
) {
  return (
    <CustomTextField
      fullWidth
      inputRef={ref}
      label={label}
      value={value ?? ''}
      onClick={onClick}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      placeholder='dd-mm-yyyy'
      InputLabelProps={{ shrink: true }}
      inputProps={{
        autoComplete: 'off',
        inputMode: 'numeric'
      }}
    />
  )
})

const TracingsGeneralTab: React.FC<TracingsGeneralTabProps> = ({ open, mode, tracingId, onLoaded, onClose }) => {
  const { t, i18n } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const userPermissions = useSelector((s: RootState) => s.auth.permissions) as string[]
  const canReadStudents =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.students') || userPermissions.includes('read.management'))
  const canReadCompanies =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.companies') || userPermissions.includes('read.management'))

  // ✅ LISTAS desde REDUX (ajusta paths si difieren)
  const courses = useSelector((s: RootState) => (s.course as any)?.courses ?? []) as List[]
  const companies = useSelector((s: RootState) => (s.company as any)?.companies ?? []) as List[]
  const students = useSelector((s: RootState) => (s.student as any)?.students ?? []) as any[]
  const trainingContractElements = useSelector(
    (s: RootState) => (s.trainingContractElement as any)?.trainingContractElements ?? []
  ) as List[]

  const coursesList = useMemo(() => (Array.isArray(courses) ? courses : []), [courses])
  const companiesList = useMemo(() => (Array.isArray(companies) ? companies : []), [companies])
  const studentsList = useMemo(() => (Array.isArray(students) ? students : []), [students])
  const trainingContractElementsList = useMemo(
    () => (Array.isArray(trainingContractElements) ? trainingContractElements : []),
    [trainingContractElements]
  )

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const loadRequestIdRef = useRef(0)

  const defaultValues = useMemo<FormValues>(
    () => ({
      course: null,
      company: null,
      student: null,
      training_contract_element: null,

      student_name: '',
      student_surname: '',

      performed_activities: 0,
      total_activities: '',
      performed_units: 0,
      total_units: '',
      performed_hours: 0,
      total_hours: '',
      last_connection: '',

      welcome_date: '',
      quarter_date: '',
      half_date: '',
      three_quarters_date: '',
      final_date: '',

      welcome_date_sent: '',
      quarter_date_sent: '',
      half_date_sent: '',
      three_quarters_date_sent: '',
      final_date_sent: '',

      welcome_message: false,
      quarter_message: false,
      half_message: false,
      three_quarters_message: false,
      final_message: false,

      follow_up_date: '',
      final_test: '',
      questionnaire: '',
      observation: ''
    }),
    []
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
    resolver: yupResolver(schema)
  })

  const disabledUi = readOnly || loading || saving
  const canEdit = !readOnly && !loading && !saving

  // fields ALWAYS disabled (según tu regla)
  const alwaysDisabledHeader = true
  const alwaysDisabledTotals = true
  const alwaysDisabledBaseDates = true

  const autoCompleteInputProps = (params: any) => ({
    ...params.inputProps,
    readOnly: disabledUi
  })

  const pick = (list: any[], id: any) => (id != null ? list.find(x => Number(x.id) === Number(id)) ?? null : null)

  // ✅ si cambia student, rellena nombre/apellidos (solo visual)
  const studentWatch: any = watch('student')
  const companyWatch: any = watch('company')
  useEffect(() => {
    if (!open) return
    if (!studentWatch) {
      setValue('student_name', '')
      setValue('student_surname', '')

      return
    }
    const name = studentWatch?.name ?? studentWatch?.first_name ?? ''
    const surname = studentWatch?.surname ?? studentWatch?.last_name ?? studentWatch?.lastnames ?? ''
    setValue('student_name', String(name))
    setValue('student_surname', String(surname))
  }, [open, studentWatch, setValue])

  const openStudentModal = (studentId?: number | null) => {
    if (!studentId || !canReadStudents) return

    dispatch(studentActions.setId(Number(studentId)))
    dispatch(studentActions.openStudentModal({ mode: 'view', studentId: Number(studentId) }))
  }

  const openCompanyModal = (companyId?: number | null) => {
    if (!companyId || !canReadCompanies) return

    dispatch(companyActions.setId(Number(companyId)))
    dispatch(companyActions.openModal({ mode: 'view', companyId: Number(companyId) }))
  }

  // ----------------------------
  // ✅ load tracing on open (edit/view)
  useEffect(() => {
    if (!open) {
      loadRequestIdRef.current += 1
      setLoading(false)

      return
    }

    if (mode === 'create' || !tracingId) {
      loadRequestIdRef.current += 1
      reset(defaultValues)
      setLoading(false)

      return
    }

    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId

    const load = async () => {
      setLoading(true)
      try {
        const res = await getTracing(tracingId)
        if (loadRequestIdRef.current !== requestId) return

        const tr = res.data?.data?.tracing ?? res.data?.data ?? res.data?.tracing ?? null
        if (!tr) throw new Error('Tracing payload not found')

        onLoaded?.(tr)

        const courseObj = pick(coursesList as any, tr.course_id) ?? tr.course ?? null
        const companyObj = pick(companiesList as any, tr.company_id) ?? tr.company ?? null
        const studentObj = pick(studentsList as any, tr.student_id) ?? tr.student ?? null
        const trainingContractElementObj =
          pick(trainingContractElementsList as any, tr.training_contract_element_id) ?? tr.training_contract_element ?? null
        const studentName = studentObj?.name ?? studentObj?.first_name ?? tr.student_name ?? ''
        const studentSurname = studentObj?.surname ?? studentObj?.last_name ?? tr.student_surname ?? ''

        reset({
          course: courseObj,
          company: companyObj,
          student: studentObj,
          training_contract_element: trainingContractElementObj,

          student_name: String(studentName ?? ''),
          student_surname: String(studentSurname ?? ''),

          performed_activities: tr.performed_activities ?? 0,
          total_activities:
            tr.total_activities ??
            tr.activities_total ??
            tr.number_activities ??
            tr.course?.training_action?.number_activities ??
            tr.course?.trainingAction?.number_activities ??
            '',
          performed_units: tr.performed_units ?? 0,
          total_units:
            tr.total_units ??
            tr.units_total ??
            tr.number_units ??
            tr.course?.training_action?.number_units ??
            tr.course?.trainingAction?.number_units ??
            '',
          performed_hours: tr.performed_hours ?? 0,
          total_hours:
            tr.total_hours ??
            tr.hours_total ??
            tr.course?.training_action?.total_hours ??
            tr.course?.trainingAction?.total_hours ??
            '',
          last_connection: toDisplayDate(tr.last_connection),

          // BASE dates (NO edit)
          welcome_date: toDisplayDate(tr.welcome_date ?? tr.welcome_date_base ?? tr.course?.welcome_date),
          quarter_date: toDisplayDate(tr.quarter_date ?? tr.quarter_date_base ?? tr.course?.quarter_date),
          half_date: toDisplayDate(tr.half_date ?? tr.half_date_base ?? tr.course?.half_date),
          three_quarters_date: toDisplayDate(
            tr.three_quarters_date ?? tr.three_quarters_date_base ?? tr.course?.three_quarters_date
          ),
          final_date: toDisplayDate(tr.final_date ?? tr.final_date_base ?? tr.course?.final_date),

          // SENT dates (EDIT)
          welcome_date_sent: toInputDate(tr.welcome_date_sent),
          quarter_date_sent: toInputDate(tr.quarter_date_sent),
          half_date_sent: toInputDate(tr.half_date_sent),
          three_quarters_date_sent: toInputDate(tr.three_quarters_date_sent),
          final_date_sent: toInputDate(tr.final_date_sent),

          // toggles
          welcome_message: String(tr.welcome_message ?? '0') === '1',
          quarter_message: String(tr.quarter_message ?? '0') === '1',
          half_message: String(tr.half_message ?? '0') === '1',
          three_quarters_message: String(tr.three_quarters_message ?? '0') === '1',
          final_message: String(tr.final_message ?? '0') === '1',

          follow_up_date: toInputDate(tr.follow_up_date),
          final_test: tr.final_test ?? '',
          questionnaire: tr.questionnaire ?? '',
          observation: tr.observation ?? ''
        })
      } catch (error) {
        if (loadRequestIdRef.current === requestId) handleError(error, logout)
      } finally {
        if (loadRequestIdRef.current === requestId) setLoading(false)
      }
    }

    load()

    return () => {
      if (loadRequestIdRef.current === requestId) {
        loadRequestIdRef.current += 1
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tracingId, mode === 'create'])

  // ----------------------------
  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    if (!tracingId) return // sin store => solo update

    setSaving(true)
    try {
      const formData = new FormData()

      // ids (si quieres permitir cambiarlos, ahora los mando; si NO, quítalos)
      formData.append('course_id', data.course?.id != null ? String(data.course.id) : '')
      formData.append('company_id', data.company?.id != null ? String(data.company.id) : '')
      formData.append('student_id', data.student?.id != null ? String(data.student.id) : '')
      formData.append(
        'training_contract_element_id',
        data.training_contract_element?.id != null ? String(data.training_contract_element.id) : ''
      )

      // editables num
      formData.append('performed_activities', String(data.performed_activities ?? '0'))
      formData.append('performed_hours', String(data.performed_hours ?? '0'))
      formData.append('performed_units', String(data.performed_units ?? '0'))

      // follow up + forms
      formData.append('follow_up_date', toApiDate(data.follow_up_date))
      formData.append('final_test', data.final_test ?? '')
      formData.append('questionnaire', data.questionnaire ?? '')

      // toggles
      formData.append('welcome_message', data.welcome_message ? '1' : '0')
      formData.append('quarter_message', data.quarter_message ? '1' : '0')
      formData.append('half_message', data.half_message ? '1' : '0')
      formData.append('three_quarters_message', data.three_quarters_message ? '1' : '0')
      formData.append('final_message', data.final_message ? '1' : '0')

      // sent dates (EDIT)
      formData.append('welcome_date_sent', toApiDate(data.welcome_date_sent))
      formData.append('quarter_date_sent', toApiDate(data.quarter_date_sent))
      formData.append('half_date_sent', toApiDate(data.half_date_sent))
      formData.append('three_quarters_date_sent', toApiDate(data.three_quarters_date_sent))
      formData.append('final_date_sent', toApiDate(data.final_date_sent))

      formData.append('observation', data.observation ?? '')

      const response = await editTracing(tracingId, formData)
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

  const renderDatePicker = (field: any, label: string) => (
    <DatePicker
      selected={parseDatePickerValue(field.value)}
      onChange={(date: Date | null) => field.onChange(toDatePickerValue(date))}
      onBlur={field.onBlur}
      dateFormat={['dd-MM-yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']}
      calendarStartDay={1}
      locale={datePickerLocale(i18n.language)}
      disabled={!canEdit}
      showMonthDropdown
      showYearDropdown
      scrollableYearDropdown
      yearDropdownItemNumber={15}
      popperClassName='mui-datepicker-popper'
      isClearable={canEdit}
      customInput={<DateInput label={t(label)} disabled={!canEdit} />}
    />
  )

  // ----------------------------
  return (
    <DatePickerWrapper>
      <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {/* ====== Información del curso ====== */}
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Course information')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* Nombre (NO editable) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='student_name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography component='span' sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                        {t('Name')}
                      </Typography>
                      {canReadStudents && studentWatch?.id ? (
                        <Box
                          role='button'
                          aria-label={t('View student')}
                          onMouseDown={e => e.preventDefault()}
                          onClick={e => {
                            e.stopPropagation()
                            openStudentModal(Number(studentWatch?.id))
                          }}
                          sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                        >
                          <Icon icon='tabler:eye' fontSize={18} />
                        </Box>
                      ) : null}
                    </Box>
                  }
                  {...field}
                  disabled={alwaysDisabledHeader}
                />
              )}
            />
          </Grid>

          {/* Apellidos (NO editable) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='student_surname'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Surnames')} {...field} disabled={alwaysDisabledHeader} />
              )}
            />
          </Grid>

          {/* Curso (NO editable) */}
          <Grid item xs={12} md={3}>
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
                      label={t('Course')}
                      disabled
                      inputProps={{ ...params.inputProps, readOnly: true }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Empresa (NO editable) + ojo */}
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
                  disabled
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component='span' sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                            {t('Company')}
                          </Typography>
                          {canReadCompanies && companyWatch?.id ? (
                            <Box
                              role='button'
                              aria-label={t('View company')}
                              onMouseDown={e => e.preventDefault()}
                              onClick={e => {
                                e.stopPropagation()
                                openCompanyModal(Number(companyWatch?.id))
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

          {/* Actividades Realizadas (editable) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='performed_activities'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Performed activities')}
                  {...field}
                  disabled={!canEdit}
                />
              )}
            />
          </Grid>

          {/* Actividades Totales (NO editable) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='total_activities'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Total activities')} {...field} disabled={alwaysDisabledTotals} />
              )}
            />
          </Grid>

          {/* Unidades Realizadas (editable) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='performed_units'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Performed units')} {...field} disabled={!canEdit} />
              )}
            />
          </Grid>

          {/* Unidades Totales (NO editable) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='total_units'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Total units')} {...field} disabled={alwaysDisabledTotals} />
              )}
            />
          </Grid>

          {/* Horas Realizadas (editable) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='performed_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Performed hours')}
                  {...field}
                  disabled={!canEdit}
                  error={Boolean(errors.performed_hours)}
                  helperText={(errors.performed_hours as any)?.message}
                />
              )}
            />
          </Grid>

          {/* Horas Totales (NO editable) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='total_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Total hours')} {...field} disabled={alwaysDisabledTotals} />
              )}
            />
          </Grid>

          {/* Última Conexión (NO editable) */}
          <Grid item xs={12} md={6}>
            <Controller
              name='last_connection'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Last connection')} {...field} disabled={alwaysDisabledHeader} />
              )}
            />
          </Grid>
        </Grid>

        {/* ====== Fechas de seguimiento ====== */}
        <Box sx={{ mt: 10, mb: 6 }}>
          <Typography variant='h6'>{t('Follow-up dates')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* Base dates (NO edit) + sent dates (EDIT) + checks */}

          {/* Bienvenida */}
          <Grid item xs={12} md={6}>
            <Controller
              name='welcome_date'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Welcome date')} {...field} disabled={alwaysDisabledBaseDates} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='welcome_date_sent'
              control={control}
              render={({ field }) => renderDatePicker(field, 'Welcome sent date')}
            />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='welcome_message'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Welcome')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={!canEdit} />
                  }
                />
              )}
            />
          </Grid>

          {/* 25% */}
          <Grid item xs={12} md={6}>
            <Controller
              name='quarter_date'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('25% date')} {...field} disabled={alwaysDisabledBaseDates} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='quarter_date_sent'
              control={control}
              render={({ field }) => renderDatePicker(field, '25% sent date')}
            />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='quarter_message'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Message 25%')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={!canEdit} />
                  }
                />
              )}
            />
          </Grid>

          {/* 50% */}
          <Grid item xs={12} md={6}>
            <Controller
              name='half_date'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('50% date')} {...field} disabled={alwaysDisabledBaseDates} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='half_date_sent'
              control={control}
              render={({ field }) => renderDatePicker(field, '50% sent date')}
            />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='half_message'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Message 50%')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={!canEdit} />
                  }
                />
              )}
            />
          </Grid>

          {/* 75% */}
          <Grid item xs={12} md={6}>
            <Controller
              name='three_quarters_date'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('75% date')} {...field} disabled={alwaysDisabledBaseDates} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='three_quarters_date_sent'
              control={control}
              render={({ field }) => renderDatePicker(field, '75% sent date')}
            />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='three_quarters_message'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Message 75%')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={!canEdit} />
                  }
                />
              )}
            />
          </Grid>

          {/* Final */}
          <Grid item xs={12} md={6}>
            <Controller
              name='final_date'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Final date')} {...field} disabled={alwaysDisabledBaseDates} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='final_date_sent'
              control={control}
              render={({ field }) => renderDatePicker(field, 'Final sent date')}
            />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='final_message'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Finalization')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={!canEdit} />
                  }
                />
              )}
            />
          </Grid>

          {/* Test Final / Cuestionario / Fecha Seguimiento */}
          <Grid item xs={12} md={4}>
            <Controller
              name='final_test'
              control={control}
              render={({ field }) => (
                <CustomTextField select fullWidth label={t('Final test')} {...field} disabled={!canEdit}>
                  {tracingResultOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='questionnaire'
              control={control}
              render={({ field }) => (
                <CustomTextField select fullWidth label={t('Questionnaire')} {...field} disabled={!canEdit}>
                  {tracingResultOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='follow_up_date'
              control={control}
              render={({ field }) => renderDatePicker(field, 'Follow-up date')}
            />
          </Grid>

          {/* Training contract element (si lo usas) */}
          <Grid item xs={12} md={6}>
            <Controller
              name='training_contract_element'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={trainingContractElementsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabledUi}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Training contract element')}
                      disabled={disabledUi}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Observación */}
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
                  placeholder={t('Observation')}
                  {...field}
                  value={field.value ?? ''}
                  disabled={!canEdit}
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
    </DatePickerWrapper>
  )
}

export default TracingsGeneralTab
