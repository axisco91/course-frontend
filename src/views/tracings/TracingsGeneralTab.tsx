// TracingsGeneralTab.tsx
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import React, { Fragment, forwardRef, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Menu,
  MenuItem,
  Switch,
  Typography
} from '@mui/material'
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
import { getEmailTemplates, getTracing, editTracing, sendTracingMail } from 'src/api/api'

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

const suitabilityOptions = [
  { value: 'apto', label: 'Apto' },
  { value: 'no_apto', label: 'No apto' }
]

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const replaceTemplateVariables = (template: string, variables: Record<string, unknown>) =>
  template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_match, key) => escapeHtml(variables[key] ?? ''))

const getMilestoneTiming = (value: unknown) => {
  const milestoneDate = parseDatePickerValue(value)
  if (!milestoneDate) return 'hoy'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return milestoneDate > today ? 'en los próximos días' : 'hoy'
}

const renderEmailBody = (template: string, variables: Record<string, unknown>) => {
  const rendered = replaceTemplateVariables(template, variables)

  return variables.milestone_timing !== 'hoy'
    ? rendered.replace(/\bhoy\b/giu, String(variables.milestone_timing))
    : rendered
}

const numericValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(String(value).replace(',', '.'))

  return Number.isFinite(parsed) ? parsed : null
}

const formatAmount = (value: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(Math.max(0, value))

const buildThreeQuartersBody = (template: string, progressMessage: string) => {
  const progressHtml = progressMessage
    .trim()
    .split(/\n\s*\n/)
    .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
  if (/\{\{\s*progress_message\s*\}\}/i.test(template)) {
    return template.replace(/<p>\s*\{\{\s*progress_message\s*\}\}\s*<\/p>/i, progressHtml)
      .replace(/\{\{\s*progress_message\s*\}\}/gi, progressHtml)
  }

  const insertionPoint = template.search(/<p>\s*(Como sabes|Saludos)/i)

  return insertionPoint >= 0
    ? `${template.slice(0, insertionPoint)}${progressHtml}${template.slice(insertionPoint)}`
    : `${template}${progressHtml}`
}

type ThreeQuartersReview = {
  scenarioLabel: string
  subject: string
  bodyHtml: string
  performedHours: number | null
  totalHours: number | null
  performedUnits: number | null
  totalUnits: number | null
  performedActivities: number | null
  totalActivities: number | null
  performedFinalEvaluation: number | null
  totalFinalEvaluations: number | null
}

type EmailReview = {
  type: string
  title: string
  subject: string
  bodyHtml: string
  extraData: Record<string, unknown>
}

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
  one_week_message: boolean

  // other
  follow_up_date: string
  suitability: string
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
  const [sendingMailType, setSendingMailType] = useState<string | null>(null)
  const [finalEmailMenuAnchor, setFinalEmailMenuAnchor] = useState<null | HTMLElement>(null)
  const [reviewingThreeQuarters, setReviewingThreeQuarters] = useState(false)
  const [threeQuartersReview, setThreeQuartersReview] = useState<ThreeQuartersReview | null>(null)
  const [reviewingMailType, setReviewingMailType] = useState<string | null>(null)
  const [emailReview, setEmailReview] = useState<EmailReview | null>(null)
  const emailBodyEditorRef = useRef<HTMLDivElement | null>(null)
  const threeQuartersBodyEditorRef = useRef<HTMLDivElement | null>(null)
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
      one_week_message: false,

      follow_up_date: '',
      suitability: '',
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
  const welcomeMessageWatch = watch('welcome_message')
  const quarterMessageWatch = watch('quarter_message')
  const halfMessageWatch = watch('half_message')
  const threeQuartersMessageWatch = watch('three_quarters_message')
  const finalMessageWatch = watch('final_message')
  const oneWeekMessageWatch = watch('one_week_message')
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
          one_week_message: String(tr.one_week_message ?? '0') === '1',

          follow_up_date: toInputDate(tr.follow_up_date),
          suitability: tr.suitability ?? '',
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
      formData.append('suitability', data.suitability ?? '')
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

  const handleSendMail = async (type: string, extraData: Record<string, any> = {}) => {
    if (!tracingId) return false

    setSendingMailType(type)
    try {
      const response = await sendTracingMail(tracingId, { type, ...extraData })
      const updatedTracing = response.data?.data?.tracing

      if (updatedTracing) {
        if (type === 'welcome') {
          setValue('welcome_message', String(updatedTracing.welcome_message ?? '0') === '1')
          setValue('welcome_date_sent', toInputDate(updatedTracing.welcome_date_sent))
        }
        if (type === 'quarter') {
          setValue('quarter_message', String(updatedTracing.quarter_message ?? '0') === '1')
          setValue('quarter_date_sent', toInputDate(updatedTracing.quarter_date_sent))
        }
        if (type === 'half') {
          setValue('half_message', String(updatedTracing.half_message ?? '0') === '1')
          setValue('half_date_sent', toInputDate(updatedTracing.half_date_sent))
        }
        if (type === 'three_quarters') {
          setValue('three_quarters_message', String(updatedTracing.three_quarters_message ?? '0') === '1')
          setValue('three_quarters_date_sent', toInputDate(updatedTracing.three_quarters_date_sent))
        }
        if (type === 'final') {
          setValue('final_message', String(updatedTracing.final_message ?? '0') === '1')
          setValue('final_date_sent', toInputDate(updatedTracing.final_date_sent))
        }
        if (type === 'one_week') {
          setValue('one_week_message' as any, String(updatedTracing.one_week_message ?? '0') === '1')
        }
      }

      toast.success(response.data?.message ?? t('Email sent'))
      dispatch(generalActions.addFilterButtonClickCount())

      return true
    } catch (error) {
      handleError(error, logout)

      return false
    } finally {
      setSendingMailType(null)
    }
  }

  const openEmailReview = async (type: string, extraData: Record<string, unknown> = {}) => {
    if (!tracingId) return

    const templateTypes: Record<string, string> = {
      welcome: 'greeting',
      quarter: 'quarter',
      half: 'half',
      final: 'final',
      one_week: 'course_end_reminder'
    }
    const titles: Record<string, string> = {
      welcome: 'Correo de bienvenida',
      quarter: 'Correo del 25 %',
      half: 'Correo del 50 %',
      final: `Correo de fin: ${extraData.final_result === 'no_apto' ? 'NO APTO' : 'APTO'}`,
      one_week: 'Correo de último día'
    }
    const templateType = templateTypes[type]
    if (!templateType) return

    setReviewingMailType(type)
    try {
      const [tracingResponse, templatesResponse] = await Promise.all([
        getTracing(tracingId),
        getEmailTemplates()
      ])
      const tr = tracingResponse.data?.data?.tracing ?? tracingResponse.data?.data ?? null
      const templates = templatesResponse.data?.data?.email_templates ?? []
      const template = templates.find((item: any) => item.mail_type === templateType)
      if (!tr || !template) throw new Error('No se ha podido preparar la vista previa del correo.')

      const trainingAction = tr.course?.training_action ?? tr.course?.trainingAction ?? {}
      const formativeCode = String(trainingAction.formative_action ?? '')
      const formativeName = String(trainingAction.name ?? '')
      const formativeAction = formativeName || formativeCode || tr.course?.name || ''
      const courseTeacherName = [tr.course?.teacher?.name, tr.course?.teacher?.surname]
        .filter(Boolean)
        .join(' ')
      const tutorName = String(
        tr.training_contract_element?.training_tutor
        || courseTeacherName
        || 'Tutor/a del curso'
      )
      const isNotSuitable = extraData.final_result === 'no_apto'
      const milestoneDate = type === 'quarter'
        ? tr.course?.quarter_date
        : type === 'half'
          ? tr.course?.half_date
          : type === 'final'
            ? tr.course?.final_date
            : null
      const milestoneTiming = getMilestoneTiming(milestoneDate)
      const previewVariables = {
        student_name: [tr.student?.name, tr.student?.surname].filter(Boolean).join(' '),
        formative_action: formativeAction,
        tutor_name: tutorName,
        subject_code: [formativeCode, tr.course?.group].filter(Boolean).join('/'),
        total_hours: trainingAction.total_hours ?? tr.total_hours ?? '-',
        course_start_date: toDisplayDate(tr.course?.beginning ?? '') || '-',
        course_end_date: toDisplayDate(tr.course?.end ?? '') || '-',
        milestone_label: type === 'quarter' ? '25 %' : type === 'half' ? '50 %' : '',
        milestone_date: type === 'quarter'
          ? toDisplayDate(tr.course?.quarter_date ?? '')
          : toDisplayDate(tr.course?.half_date ?? ''),
        milestone_timing: milestoneTiming,
        final_result: isNotSuitable ? 'NO APTO' : 'APTO',
        final_intro: isNotSuitable
          ? `Le informamos de que el curso finaliza ${milestoneTiming} y, tras revisar su actividad en la plataforma, su calificación final es de NO APTO.`
          : 'Te informamos de que has obtenido la calificación de APTO en el curso.',
        final_detail: isNotSuitable
          ? 'No se han alcanzado los requisitos de conexión, visualización de unidades y realización de evaluaciones establecidos para superar la formación.'
          : '¡Enhorabuena por haber completado satisfactoriamente la formación!'
      }

      setEmailReview({
        type,
        title: titles[type],
        subject: replaceTemplateVariables(template.subject, previewVariables),
        bodyHtml: renderEmailBody(template.body_html, previewVariables),
        extraData,
      })
    } catch (error) {
      handleError(error, logout)
    } finally {
      setReviewingMailType(null)
    }
  }

  const sendReviewedMail = async () => {
    if (!emailReview) return
    const sent = await handleSendMail(emailReview.type, {
      ...emailReview.extraData,
      subject: emailReview.subject,
      body_html: emailBodyEditorRef.current?.innerHTML ?? emailReview.bodyHtml
    })
    if (sent) setEmailReview(null)
  }

  const openThreeQuartersReview = async () => {
    if (!tracingId) return

    setReviewingThreeQuarters(true)
    try {
      const [tracingResponse, templatesResponse] = await Promise.all([
        getTracing(tracingId, { refresh_moodle: 1 }),
        getEmailTemplates()
      ])
      const tr = tracingResponse.data?.data?.tracing ?? tracingResponse.data?.data ?? null
      const templates = templatesResponse.data?.data?.email_templates ?? []
      const template = templates.find((item: any) => item.mail_type === 'three_quarters')
      if (!tr || !template) throw new Error('No se han podido preparar los datos del correo del 75 %.')

      const trainingAction = tr.course?.training_action ?? tr.course?.trainingAction ?? {}
      const performedHours = numericValue(tr.performed_hours)
      const totalHours = numericValue(tr.total_hours ?? trainingAction.total_hours)
      const performedUnits = numericValue(tr.performed_units)
      const totalUnits = numericValue(tr.total_units ?? tr.number_units ?? trainingAction.number_units)
      const performedActivities = numericValue(tr.performed_activities)
      const totalActivities = numericValue(
        tr.total_activities ?? tr.number_activities ?? trainingAction.number_activities
      )
      const totalFinalEvaluations = numericValue(tr.number_final_evaluations)
      const performedFinalEvaluation = totalFinalEvaluations !== null && totalFinalEvaluations > 0
        ? (Number(tr.final_test) === 1 ? 1 : 0)
        : 0
      const courseEndDate = toDisplayDate(tr.course?.end ?? tr.course_end ?? '') || 'la fecha indicada'

      const pending: string[] = []
      const addPending = (performed: number | null, total: number | null, singular: string, plural: string) => {
        if (total === null || total <= 0) return
        const remaining = Math.max(total - (performed ?? 0), 0)
        if (remaining > 0) pending.push(`${formatAmount(remaining)} ${remaining === 1 ? singular : plural}`)
      }
      addPending(performedHours, totalHours, 'hora de conexión', 'horas de conexión')
      addPending(performedUnits, totalUnits, 'unidad', 'unidades')
      addPending(performedActivities, totalActivities, 'evaluación', 'evaluaciones')
      if (totalFinalEvaluations !== null && totalFinalEvaluations > 0 && performedFinalEvaluation === 0) {
        pending.push('la evaluación final')
      }

      const hasKnownTotals = [totalHours, totalUnits, totalActivities, totalFinalEvaluations]
        .some(value => value !== null && value > 0)
      const pendingText = pending.join(', ').replace(/, ([^,]*)$/, ' y $1')
      const progressRatios = [
        totalHours !== null && totalHours > 0 ? (performedHours ?? 0) / totalHours : null,
        totalUnits !== null && totalUnits > 0 ? (performedUnits ?? 0) / totalUnits : null,
        totalActivities !== null && totalActivities > 0 ? (performedActivities ?? 0) / totalActivities : null
      ].filter((value): value is number => value !== null)
      const isAdvanced = progressRatios.length > 0 && progressRatios.every(value => value >= 0.75)
      const hasNotStartedUnits = totalUnits !== null && totalUnits > 0 && (performedUnits ?? 0) === 0
      const lastConnectionRaw = String(tr.last_connection ?? '').trim()
      const lastConnectionDate = lastConnectionRaw && lastConnectionRaw !== 'Never accessed'
        ? new Date(lastConnectionRaw.replace(' ', 'T'))
        : null
      const inactiveDays = lastConnectionDate && !Number.isNaN(lastConnectionDate.getTime())
        ? Math.floor((Date.now() - lastConnectionDate.getTime()) / 86400000)
        : null
      const isInactive = inactiveDays === null || inactiveDays >= 7

      let scenarioLabel = 'Progreso con pendientes'
      let progressMessage = pending.length > 0
        ? `Actualmente te quedan ${pendingText} por completar. Recuerda que el curso finaliza el ${courseEndDate} y es importante que completes todos los requisitos antes de esa fecha.

Te recomendamos acceder a la plataforma con regularidad, organizar el tiempo disponible y avanzar de forma progresiva en las unidades y evaluaciones pendientes. Para superar satisfactoriamente la formación, debes visualizar la totalidad de las unidades, completar todas las evaluaciones y alcanzar la puntuación mínima establecida.

Revisa tu progreso y procura no dejar el trabajo para los últimos días. Si tienes alguna dificultad para continuar, acceder a una unidad o realizar una evaluación, ponte en contacto conmigo para que pueda ayudarte.`
        : hasKnownTotals
          ? `Has completado todos los requisitos registrados. Puedes seguir repasando el contenido hasta la finalización del curso, el ${courseEndDate}.`
          : `Revisa las horas, unidades y evaluaciones del curso. Recuerda que el curso finaliza el ${courseEndDate}.`

      if (hasNotStartedUnits) {
        scenarioLabel = 'Primera unidad sin iniciar'
        const hoursStatus = totalHours !== null
          ? `Aunque llevas ${formatAmount(performedHours ?? 0)} ${performedHours === 1 ? 'hora contabilizada' : 'horas contabilizadas'} de las ${formatAmount(totalHours)} horas totales en la plataforma, no has iniciado la primera unidad del curso.`
          : 'Todavía no has iniciado la primera unidad del curso.'
        progressMessage = `${hoursStatus} Te recordamos que la formación finaliza el ${courseEndDate}.

Para obtener la calificación de apto, es necesario visualizar la totalidad de las unidades, realizar todas las evaluaciones y obtener al menos una nota mínima de 5 en cada una de ellas.

Te animamos a comenzar cuanto antes con la primera unidad para poder completar la formación dentro del plazo establecido. Si tienes cualquier dificultad para acceder o necesitas ayuda para comenzar, estoy a tu disposición.`
      } else if (isInactive && pending.length > 0) {
        scenarioLabel = 'Sin acceso reciente'
        progressMessage = `Hemos comprobado que no has vuelto a acceder a la plataforma en los últimos días. Actualmente te quedan ${pendingText} por completar.

La fecha de finalización del curso es el ${courseEndDate}, por lo que es importante que retomes la formación lo antes posible para cumplir los requisitos dentro del plazo disponible.

Si estás teniendo algún problema o dificultad que te impida continuar, ponte en contacto conmigo para poder ayudarte.`
      } else if (isAdvanced) {
        scenarioLabel = pending.length > 0 ? 'Progreso avanzado' : 'Requisitos completados'
        const remainingText = pending.length > 0
          ? `Te animamos a realizar un último repaso y completar ${pendingText} antes del ${courseEndDate}.`
          : `Has completado los requisitos registrados. Puedes seguir repasando el contenido hasta la finalización del curso, el ${courseEndDate}.`
        progressMessage = `Hemos comprobado que llevas el curso muy avanzado y queremos felicitarte por el buen trabajo realizado y por el seguimiento constante que has mantenido durante la formación.

${remainingText}

Enhorabuena por el trabajo realizado y mucho ánimo en este último tramo.`
      }

      setValue('performed_hours', performedHours ?? 0)
      setValue('total_hours', totalHours ?? '')
      setValue('performed_units', performedUnits ?? 0)
      setValue('total_units', totalUnits ?? '')
      setValue('performed_activities', performedActivities ?? 0)
      setValue('total_activities', totalActivities ?? '')

      const formativeCode = String(trainingAction.formative_action ?? '')
      const formativeName = String(trainingAction.name ?? '')
      const formativeAction = formativeName || formativeCode || tr.course?.name || ''
      const previewTutorName = String(
        tr.training_contract_element?.training_tutor
        || [tr.course?.teacher?.name, tr.course?.teacher?.surname].filter(Boolean).join(' ')
        || 'Tutor/a del curso'
      )
      const previewVariables = {
        student_name: [tr.student?.name, tr.student?.surname].filter(Boolean).join(' '),
        formative_action: formativeAction,
        tutor_name: previewTutorName,
        subject_code: [formativeCode, tr.course?.group].filter(Boolean).join('/'),
        course_end_date: courseEndDate,
        milestone_timing: getMilestoneTiming(tr.course?.three_quarters_date),
        remaining_hours: totalHours !== null ? formatAmount(Math.max(totalHours - (performedHours ?? 0), 0)) : '-',
        remaining_units: totalUnits !== null ? formatAmount(Math.max(totalUnits - (performedUnits ?? 0), 0)) : '-',
        remaining_activities: totalActivities !== null
          ? formatAmount(Math.max(totalActivities - (performedActivities ?? 0), 0))
          : '-'
      }
      setThreeQuartersReview({
        scenarioLabel,
        subject: replaceTemplateVariables(template.subject, previewVariables),
        bodyHtml: renderEmailBody(
          buildThreeQuartersBody(template.body_html, progressMessage),
          previewVariables
        ),
        performedHours,
        totalHours,
        performedUnits,
        totalUnits,
        performedActivities,
        totalActivities,
        performedFinalEvaluation,
        totalFinalEvaluations
      })
    } catch (error) {
      handleError(error, logout)
    } finally {
      setReviewingThreeQuarters(false)
    }
  }

  const sendReviewedThreeQuartersMail = async () => {
    if (!threeQuartersReview) return
    const sent = await handleSendMail('three_quarters', {
      subject: threeQuartersReview.subject,
      body_html: threeQuartersBodyEditorRef.current?.innerHTML ?? threeQuartersReview.bodyHtml
    })
    if (sent) setThreeQuartersReview(null)
  }

  const openFinalEmailMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFinalEmailMenuAnchor(event.currentTarget)
  }

  const closeFinalEmailMenu = () => {
    setFinalEmailMenuAnchor(null)
  }

  const sendFinalMailWithResult = async (finalResult: 'apto' | 'no_apto') => {
    closeFinalEmailMenu()
    await openEmailReview('final', { final_result: finalResult })
  }

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

        <Box
          sx={{
            mb: 6,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'repeat(1, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))'
            }
          }}
        >
          <Button
            variant='outlined'
            disabled={loading || saving || reviewingMailType !== null || sendingMailType !== null || Boolean(welcomeMessageWatch)}
            onClick={() => openEmailReview('welcome')}
            sx={{ width: '100%' }}
          >
            {reviewingMailType === 'welcome'
              ? 'Preparando...'
              : sendingMailType === 'welcome' ? 'Enviando...' : 'Enviar correo bienvenida'}
          </Button>
          <Button
            variant='outlined'
            disabled={loading || saving || reviewingMailType !== null || sendingMailType !== null || Boolean(halfMessageWatch)}
            onClick={() => openEmailReview('half')}
            sx={{ width: '100%' }}
          >
            {reviewingMailType === 'half'
              ? 'Preparando...'
              : sendingMailType === 'half' ? 'Enviando...' : 'Enviar 50%'}
          </Button>
          <Button
            variant='outlined'
            disabled={loading || saving || reviewingMailType !== null || sendingMailType !== null || Boolean(oneWeekMessageWatch)}
            onClick={() => openEmailReview('one_week')}
            sx={{ width: '100%' }}
          >
            {reviewingMailType === 'one_week'
              ? 'Preparando...'
              : sendingMailType === 'one_week' ? 'Enviando...' : 'Enviar correo termina hoy'}
          </Button>
          <Button
            variant='outlined'
            disabled={loading || saving || reviewingMailType !== null || sendingMailType !== null || Boolean(quarterMessageWatch)}
            onClick={() => openEmailReview('quarter')}
            sx={{ width: '100%' }}
          >
            {reviewingMailType === 'quarter'
              ? 'Preparando...'
              : sendingMailType === 'quarter' ? 'Enviando...' : 'Enviar 25%'}
          </Button>
          <Button
            variant='outlined'
            disabled={
              loading || saving || reviewingThreeQuarters || sendingMailType !== null || Boolean(threeQuartersMessageWatch)
            }
            onClick={openThreeQuartersReview}
            sx={{ width: '100%' }}
          >
            {reviewingThreeQuarters
              ? 'Actualizando Moodle...'
              : sendingMailType === 'three_quarters'
                ? 'Enviando...'
                : 'Enviar 75%'}
          </Button>
          <Button
            variant='outlined'
            disabled={
              loading || saving || reviewingMailType !== null || sendingMailType !== null || Boolean(finalMessageWatch)
            }
            onClick={openFinalEmailMenu}
            sx={{ width: '100%' }}
          >
            {reviewingMailType === 'final'
              ? 'Preparando...'
              : sendingMailType === 'final' ? 'Enviando...' : 'Enviar correo fin'}
          </Button>
          <Menu
            anchorEl={finalEmailMenuAnchor}
            open={Boolean(finalEmailMenuAnchor)}
            onClose={closeFinalEmailMenu}
          >
            <MenuItem onClick={() => sendFinalMailWithResult('apto')}>Apto</MenuItem>
            <MenuItem onClick={() => sendFinalMailWithResult('no_apto')}>No apto</MenuItem>
          </Menu>

          <Dialog
            open={Boolean(threeQuartersReview)}
            onClose={() => sendingMailType === null && setThreeQuartersReview(null)}
            fullWidth
            maxWidth='md'
          >
            <DialogTitle>Revisar correo del 75 %</DialogTitle>
            <DialogContent>
              {threeQuartersReview ? (
                <Grid container spacing={4} sx={{ pt: 1 }}>
                  {[
                    ['Horas', threeQuartersReview.performedHours, threeQuartersReview.totalHours],
                    ['Unidades', threeQuartersReview.performedUnits, threeQuartersReview.totalUnits],
                    ['Evaluaciones', threeQuartersReview.performedActivities, threeQuartersReview.totalActivities],
                    [
                      'Evaluación final',
                      threeQuartersReview.performedFinalEvaluation,
                      threeQuartersReview.totalFinalEvaluations
                    ]
                  ].map(([label, performed, total]) => (
                    <Grid item xs={12} sm={6} md={3} key={String(label)}>
                      <Box sx={{ p: 3, border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Typography variant='body2' color='text.secondary'>{String(label)}</Typography>
                        <Typography variant='h6'>
                          {performed === null ? '-' : formatAmount(Number(performed))} /{' '}
                          {total === null ? '-' : formatAmount(Number(total))}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}

                  <Grid item xs={12}>
                    <Box sx={{ px: 3, py: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant='body2' color='text.secondary'>Caso detectado</Typography>
                      <Typography variant='subtitle1'>{threeQuartersReview.scenarioLabel}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <CustomTextField
                      fullWidth
                      label='Asunto'
                      value={threeQuartersReview.subject}
                      onChange={event => setThreeQuartersReview(current => current
                        ? { ...current, subject: event.target.value }
                        : current
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='subtitle2' sx={{ mb: 2 }}>Mensaje editable</Typography>
                    <Box
                      ref={threeQuartersBodyEditorRef}
                      contentEditable
                      suppressContentEditableWarning
                      dangerouslySetInnerHTML={{ __html: threeQuartersReview.bodyHtml }}
                      sx={{
                        minHeight: 280,
                        p: 3,
                        border: theme => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        outline: 'none',
                        '&:focus': { borderColor: 'primary.main' }
                      }}
                    />
                  </Grid>
                </Grid>
              ) : null}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setThreeQuartersReview(null)}
                disabled={sendingMailType === 'three_quarters'}
              >
                Cancelar
              </Button>
              <Button
                variant='contained'
                onClick={sendReviewedThreeQuartersMail}
                disabled={sendingMailType === 'three_quarters' || !threeQuartersReview?.subject.trim()}
                startIcon={sendingMailType === 'three_quarters' ? <CircularProgress size={18} /> : undefined}
              >
                {sendingMailType === 'three_quarters' ? 'Enviando...' : 'Confirmar y enviar'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={Boolean(emailReview)}
            onClose={() => sendingMailType === null && setEmailReview(null)}
            fullWidth
            maxWidth='md'
          >
            <DialogTitle>{emailReview?.title ?? 'Revisar correo'}</DialogTitle>
            <DialogContent>
              {emailReview ? (
                <Box sx={{ pt: 1 }}>
                  <CustomTextField
                    fullWidth
                    label='Asunto'
                    value={emailReview.subject}
                    onChange={event => setEmailReview(current => current
                      ? { ...current, subject: event.target.value }
                      : current
                    )}
                    sx={{ mb: 4 }}
                  />
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>Mensaje editable</Typography>
                  <Box
                    ref={emailBodyEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: emailReview.bodyHtml }}
                    sx={{
                      minHeight: 430,
                      p: 3,
                      border: theme => `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      outline: 'none',
                      '&:focus': { borderColor: 'primary.main' }
                    }}
                  />
                </Box>
              ) : null}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEmailReview(null)} disabled={sendingMailType !== null}>
                Cancelar
              </Button>
              <Button
                variant='contained'
                onClick={sendReviewedMail}
                disabled={sendingMailType !== null || !emailReview?.subject.trim()}
                startIcon={sendingMailType !== null ? <CircularProgress size={18} /> : undefined}
              >
                {sendingMailType !== null ? 'Enviando...' : 'Confirmar y enviar'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>

        <Grid container spacing={5}>
          {/* Base dates (NO edit) + sent dates (EDIT) + checks */}

          {/* Bienvenida */}
          <Grid item xs={12} md={4}>
            <Controller
              name='welcome_date'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Welcome date')} {...field} disabled={alwaysDisabledBaseDates} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <Controller
              name='quarter_date'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('25% date')} {...field} disabled={alwaysDisabledBaseDates} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <Controller
              name='half_date'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('50% date')} {...field} disabled={alwaysDisabledBaseDates} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <Controller
              name='three_quarters_date'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('75% date')} {...field} disabled={alwaysDisabledBaseDates} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <Controller
              name='final_date'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Final date')} {...field} disabled={alwaysDisabledBaseDates} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
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

          {/* Test Final / Cuestionario / Aptitud */}
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
              name='suitability'
              control={control}
              render={({ field }) => (
                <CustomTextField select fullWidth label='Apto o no apto' {...field} disabled={!canEdit}>
                  <MenuItem value=''>
                    <em>{t('Not specified')}</em>
                  </MenuItem>
                  {suitabilityOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
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

          <Grid item xs={12} md={6}>
            <Controller
              name='follow_up_date'
              control={control}
              render={({ field }) => renderDatePicker(field, 'Follow-up date')}
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
