// src/views/training-contracts/tabs/TrainingContractGeneralTab.tsx

import Autocomplete from 'src/views/components/GuardedAutocomplete'
import React, { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState, forwardRef } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Grid, IconButton, InputAdornment, Tooltip, Typography } from '@mui/material'
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
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

// ✅ APIs
import {
  createTrainingContract,
  editTrainingContract,
  calculateEndDates,
  getTrainingContract,
  getTrainingContractElementsWithId
} from 'src/api/api'

// ✅ reducers
import { studentActions } from 'src/reducers/students/StudentReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'

// ✅ react-datepicker
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from 'dayjs'
import { es, enUS } from 'date-fns/locale'

type Mode = 'view' | 'edit' | 'create'
type List = { id: number; name: string; label?: string }

type FormValues = {
  number_cfa: string
  company: List | null
  student_id: number | null

  occupation: List | null
  advisor: List | null
  provider: List | null
  province: List | null

  company_tutor: string
  company_tutor_dni: string
  center_of_work: string

  disabled: boolean
  youth_guarantee: boolean
  social_exclusion: boolean

  specialty: boolean
  professional_certificate: boolean
  bonification: boolean

  beginning: string
  end: string
  beginning_formation: string
  end_formation: string

  annually_day_hours: number | string
  formation_hours: number | string

  percentage_first_year: number | string
  bonus_hours_first_year: number | string
  formative_hours_first_year: number | string
  daily_hours_1: number | string

  percentage_second_year: number | string
  bonus_hours_second_year: number | string
  formative_hours_second_year: number | string
  daily_hours_2: number | string

  training_schedule: string
  working_hours: string
  complete_schedule: string

  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean

  training_contract_status: List | null
  on_leave_type: List | null
  on_leave_date: Date | null

  collaborator: List | null
  observations: string
}

const datePickerLocale = (lng: string) => (lng?.startsWith('es') ? es : enUS)

const schema = (t: (k: string) => string) =>
  yup.object().shape({
    company: yup.mixed<List>().nullable().required(t('Company is required')),
    student_id: yup.number().nullable().required(t('Student is required')),
    beginning: yup.string().required(t('Contract start date is required')),
    end: yup
      .string()
      .test('end-after-beginning', t('Contract end date must be on/after contract start date'), function (value) {
        const beginning = this.parent.beginning
        if (!value || !beginning) return true

        const contractEnd = dayjs(value)
        const contractStart = dayjs(beginning)
        if (!contractEnd.isValid() || !contractStart.isValid()) return false

        return !contractEnd.isBefore(contractStart, 'day')
      }),
    beginning_formation: yup
      .string()
      .required(t('Training start date is required'))
      .test('bf-after-b', t('Training start date must be on/after contract start date'), function (value) {
        const beginning = this.parent.beginning
        if (!value || !beginning) return true

        const trainingStart = dayjs(value)
        const contractStart = dayjs(beginning)
        if (!trainingStart.isValid() || !contractStart.isValid()) return false

        return !trainingStart.isBefore(contractStart, 'day')
      }),
    end_formation: yup
      .string()
      .test('ef-after-bf', t('Training end date must be on/after training start date'), function (value) {
        const beginningFormation = this.parent.beginning_formation
        if (!value || !beginningFormation) return true

        const trainingEnd = dayjs(value)
        const trainingStart = dayjs(beginningFormation)
        if (!trainingEnd.isValid() || !trainingStart.isValid()) return false

        return !trainingEnd.isBefore(trainingStart, 'day')
      })
  })

interface Props {
  open: boolean
  mode: Mode
  trainingContractId: number | null
  cloneId?: number | null
  onClose?: () => void
  onLoaded?: (trainingContract: any) => void
}

type CustomInputProps = {
  value?: any
  onClick?: any
  onBlur?: any
  label: string
  error?: boolean
  helperText?: string
  disabled?: boolean
}

const CustomDateInput = forwardRef<HTMLInputElement, CustomInputProps>(function CustomDateInput(
  { value, onClick, onBlur, label, error, helperText, disabled },
  ref
) {
  return (
    <CustomTextField
      fullWidth
      label={label}
      value={value ?? ''}
      onClick={onClick}
      onBlur={onBlur}
      inputRef={ref}
      disabled={disabled}
      error={error}
      helperText={helperText}
      inputProps={{
        readOnly: true,
        autoComplete: 'new-password',
        autoCorrect: 'off',
        spellCheck: false
      }}
    />
  )
})

const parseYmdToDate = (v: any): Date | null => {
  if (!v) return null
  const d = dayjs(String(v))

  return d.isValid() ? d.toDate() : null
}

const toYmd = (d: Date | null) => (d ? dayjs(d).format('YYYY-MM-DD') : '')

const getOptionLabelSafe = (o: any) => {
  if (!o) return ''
  if (typeof o === 'string') return o
  const label = o?.label ?? o?.name ?? ''
  if (label && typeof label === 'object') {
    return String(label?.label ?? label?.name ?? '').trim()
  }

  return typeof label === 'string' ? label : String(label)
}

// ✅ helper num seguro (para payloads string/number)
const safeNum = (v: any) => {
  const n = Number(String(v ?? '').replace(',', '.'))

  return Number.isFinite(n) ? n : 0
}

const TrainingContractGeneralTab: React.FC<Props> = ({ open, mode, trainingContractId, cloneId, onClose, onLoaded }) => {
  const { t, i18n } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()
  const userPermissions = useSelector((s: RootState) => s.auth.permissions) as string[]
  const canReadCompanies =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.companies') || userPermissions.includes('read.management'))
  const canReadStudents =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.students') || userPermissions.includes('read.management'))

  // ✅ store lists
  const companiesRaw = useSelector((s: RootState) => s.company?.companies) as any[]
  const studentsRaw = useSelector((s: RootState) => s.student?.students) as any[]
  const occupationsRaw = useSelector((s: RootState) => (s as any).occupation?.occupations) as any[]
  const provincesRaw = useSelector((s: RootState) => (s as any).province?.provinces) as any[]
  const advisorsRaw = useSelector((s: RootState) => (s as any).advisor?.advisors) as any[]
  const providersRaw = useSelector((s: RootState) => (s as any).provider?.providers) as any[]

  const trainingContractStatusesRaw = useSelector(
    (s: RootState) => (s as any).trainingContractStatus?.trainingContractStatuses
  ) as any[]

  const onLeaveTypesRaw = useSelector((s: RootState) => (s as any).onLeave?.onLeaves) as any[]
  const collaboratorsRaw = useSelector((s: RootState) => (s as any).collaborator?.collaborators) as any[]

  const contractNumber = useSelector((s: RootState) => (s as any).trainingContract?.contractNumber) as any
  const totalFormationHours = useSelector((s: RootState) => (s as any).trainingContract?.totalFormationHours) as any

  const lastCreatedCompany = useSelector((s: RootState) => (s.company as any)?.lastCreatedCompany) as any
  const lastCreatedStudent = useSelector((s: RootState) => (s.student as any)?.lastCreatedStudent) as any

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const [loadedContractId, setLoadedContractId] = useState<number | null>(null)
  const [loadedContractData, setLoadedContractData] = useState<any | null>(null)
  const [studentFallback, setStudentFallback] = useState<List | null>(null)
  const skipCompanySyncRef = useRef(false)
  const submitInFlightRef = useRef(false)

  const disabledAll = readOnly || loading || saving

  const getStudentFullName = (st: any) => {
    const first = String(st?.name ?? st?.first_name ?? st?.student_name ?? '')
    const last = String(st?.surname ?? st?.last_name ?? st?.lastname ?? st?.student_surname ?? '')
    const full = `${first} ${last}`.replace(/\s+/g, ' ').trim()

    return { first, last, full: full || String(st?.student ?? st?.full_name ?? st?.label ?? '').trim() }
  }

  const toList = (arr: any[], keyName = 'name'): List[] =>
    Array.isArray(arr)
      ? arr.map(x => ({
          id: Number(x.id ?? x.value),
          name: String(x[keyName] ?? x.name ?? x.label ?? ''),
          label: String(x.label ?? x[keyName] ?? x.name ?? '')
        }))
      : []

  const companiesList = useMemo(() => toList(companiesRaw, 'name'), [companiesRaw])
  const occupationsList = useMemo(() => toList(occupationsRaw, 'name'), [occupationsRaw])
  const provincesList = useMemo(() => toList(provincesRaw, 'name'), [provincesRaw])
  const advisorsList = useMemo(() => toList(advisorsRaw, 'name'), [advisorsRaw])
  const providersList = useMemo(() => toList(providersRaw, 'name'), [providersRaw])
  const trainingContractStatusesList = useMemo(
    () => toList(trainingContractStatusesRaw, 'name'),
    [trainingContractStatusesRaw]
  )
  const onLeaveTypesList = useMemo(() => toList(onLeaveTypesRaw, 'name'), [onLeaveTypesRaw])
  const collaboratorsList = useMemo(() => toList(collaboratorsRaw, 'name'), [collaboratorsRaw])

  const defaultValues = useMemo<FormValues>(
    () => ({
      number_cfa: String(contractNumber ?? ''),
      company: null,
      student_id: null,

      occupation: null,
      advisor: null,
      provider: null,
      province: null,

      company_tutor: '',
      company_tutor_dni: '',
      center_of_work: '',

      disabled: false,
      youth_guarantee: false,
      social_exclusion: false,

      specialty: false,
      professional_certificate: false,
      bonification: false,

      beginning: '',
      end: '',
      beginning_formation: '',
      end_formation: '',

      annually_day_hours: '',
      formation_hours: totalFormationHours ?? '',

      percentage_first_year: 0,
      bonus_hours_first_year: 0,
      formative_hours_first_year: '',
      daily_hours_1: '',

      percentage_second_year: 0,
      bonus_hours_second_year: 0,
      formative_hours_second_year: '',
      daily_hours_2: '',

      training_schedule: '',
      working_hours: '',
      complete_schedule: '',

      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,

      training_contract_status: null,
      on_leave_type: null,
      on_leave_date: null,

      collaborator: null,
      observations: ''
    }),
    [contractNumber, totalFormationHours]
  )

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema(t))
  })

  const pick = useCallback(
    (list: List[], id: any) => (id != null ? list.find(x => Number(x.id) === Number(id)) ?? null : null),
    []
  )
  const pickWithFallback = useCallback(
    (list: List[], id: any, ...labels: any[]) => {
      const selected = pick(list, id)
      if (selected) return selected
      if (id == null || id === '') return null

      const label =
        labels
          .map(value => {
            if (typeof value === 'string') return value.trim()
            if (value && typeof value === 'object') return String(value.name ?? value.label ?? '').trim()

            return String(value ?? '').trim()
          })
          .find(Boolean) ?? String(id)

      return { id: Number(id), name: label, label }
    },
    [pick]
  )

  const buildStudentFallback = useCallback((contract: any): List | null => {
    const nestedStudent = contract?.student && typeof contract.student === 'object' ? contract.student : null
    const first = String(
      contract?.student_name ?? contract?.student_first_name ?? nestedStudent?.name ?? nestedStudent?.first_name ?? ''
    ).trim()
    const last = String(
      contract?.student_surname ??
        contract?.student_last_name ??
        nestedStudent?.surname ??
        nestedStudent?.last_name ??
        nestedStudent?.lastname ??
        ''
    ).trim()
    const full = `${first} ${last}`.replace(/\s+/g, ' ').trim()
    const nestedLabel = nestedStudent
      ? String(
          nestedStudent?.label ??
            nestedStudent?.full_name ??
            `${nestedStudent?.name ?? ''} ${nestedStudent?.surname ?? nestedStudent?.last_name ?? ''}`
        )
          .replace(/\s+/g, ' ')
          .trim()
      : ''
    const directStudentLabel = typeof contract?.student === 'string' ? contract.student.trim() : ''
    const label = full || nestedLabel || String(contract?.student_full_name ?? directStudentLabel ?? '').trim()

    return contract?.student_id ? { id: Number(contract.student_id), name: first || label, label } : null
  }, [])

  // ✅ Filtrar alumnos por empresa
  const companySelected = watch('company')
  const filteredStudentsList = useMemo<List[]>(() => {
    const cid = companySelected?.id
    if (!cid) return []

    const filtered = (studentsRaw || []).filter((st: any) => Number(st.company_id) === Number(cid))

    return filtered.map((st: any) => {
      const { first, full } = getStudentFullName(st)

      return { id: Number(st.id ?? st.value), name: first, label: full }
    })
  }, [studentsRaw, companySelected?.id])

  // ✅ selected student option (con fallback)
  const selectedStudentOption = useMemo(() => {
    const sid = watch('student_id')
    if (!sid) return null

    const fromList = filteredStudentsList.find(s => Number(s.id) === Number(sid))
    if (fromList) return fromList
    if (studentFallback && Number(studentFallback.id) === Number(sid)) return studentFallback

    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStudentsList, studentFallback, watch('student_id')])

  useEffect(() => {
    const sid = watch('student_id')
    if (!sid) return
    const exists = filteredStudentsList.some(s => Number(s.id) === Number(sid))
    if (exists) setStudentFallback(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStudentsList])

  useEffect(() => {
    const cid = companySelected?.id
    if (!cid) return
    if (skipCompanySyncRef.current) {
      skipCompanySyncRef.current = false

      return
    }

    const company: any = (companiesRaw || []).find((c: any) => Number(c.id) === Number(cid))
    if (!company) return

    if (company.advisor_id) setValue('advisor', pick(advisorsList, company.advisor_id), { shouldDirty: true })
    else setValue('advisor', null, { shouldDirty: true })

    setValue('student_id', null, { shouldDirty: true })
    setStudentFallback(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companySelected?.id])

  // ✅ BONUS horas calculadas
  const annually = watch('annually_day_hours')
  const p1 = watch('percentage_first_year')
  const p2 = watch('percentage_second_year')

  useEffect(() => {
    if (!open) return
    if (readOnly) return

    const a = Number(String(annually).replace(',', '.') || 0)
    const pp1 = Number(String(p1).replace(',', '.') || 0)
    const pp2 = Number(String(p2).replace(',', '.') || 0)
    if (Number.isNaN(a) || Number.isNaN(pp1) || Number.isNaN(pp2)) return

    const first = a === 0 || pp1 === 0 ? 0 : (a * pp1) / 100
    setValue('bonus_hours_first_year', Number(first.toFixed(2)), { shouldDirty: false })

    if (a === 0 || pp2 === 0) {
      setValue('bonus_hours_second_year', 0, { shouldDirty: false })
    } else {
      const second = (a * pp2) / 100
      const rounded = Math.round(second / 5) * 5
      setValue('bonus_hours_second_year', Number(rounded.toFixed(2)), { shouldDirty: false })
    }
  }, [open, readOnly, annually, p1, p2, setValue])

  // ✅✅ Load Contract (General) + set id in redux + preload elements/planned (optional)
  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      setLoading(false)
      setLoadedContractId(null)
      setLoadedContractData(null)
      setStudentFallback(null)
      reset(defaultValues)
      setValue('number_cfa', String(contractNumber ?? ''), { shouldDirty: false })
      if (totalFormationHours != null) setValue('formation_hours', totalFormationHours, { shouldDirty: false })

      // limpiar formation redux (por si vienes de otro contrato)
      dispatch(trainingContractActions.setId(null))
      dispatch(trainingContractActions.setElements([]))
      dispatch(trainingContractActions.setHours(0))

      // ✅ limpiar también métricas de formación
      dispatch(trainingContractActions.setFormationHours(0))
      dispatch(trainingContractActions.setFormativeHoursFirstYear(0))
      dispatch(trainingContractActions.setFormativeHoursSecondYear(0))
      dispatch(trainingContractActions.setDailyHours1(0))
      dispatch(trainingContractActions.setDailyHours2(0))
      dispatch(trainingContractActions.setTotalDays(0))

      return
    }

    if (!trainingContractId) {
      setLoadedContractData(null)

      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getTrainingContract(trainingContractId)
        if (cancelled) return

        const sc =
          res?.data?.data?.training_contract ??
          res?.data?.data?.trainingContract ??
          res?.data?.data ??
          res?.data ??
          null

        if (!sc) throw new Error('Training contract payload not found')

        const contractId = Number(sc.id ?? trainingContractId)
        setLoadedContractId(contractId)
        setLoadedContractData(sc)
        onLoaded?.(sc)

        // ✅ el id lo necesita FormationTab
        dispatch(trainingContractActions.setId(contractId))

        // ✅✅✅ AÑADIDO: precargar en Redux las métricas del bloque "Calcular Itinerario"
        // (para que FormationTab no muestre 0 al entrar)
        dispatch(trainingContractActions.setFormationHours(safeNum(sc.formation_hours ?? sc.total_hours ?? 0)))
        dispatch(trainingContractActions.setFormativeHoursFirstYear(safeNum(sc.formative_hours_first_year ?? 0)))
        dispatch(trainingContractActions.setFormativeHoursSecondYear(safeNum(sc.formative_hours_second_year ?? 0)))
        dispatch(trainingContractActions.setDailyHours1(safeNum(sc.daily_hours_1 ?? 0)))
        dispatch(trainingContractActions.setDailyHours2(safeNum(sc.daily_hours_2 ?? 0)))
        dispatch(trainingContractActions.setTotalDays(safeNum(sc.total_days ?? 0)))
        dispatch(trainingContractActions.setTrainingContract(sc))

        // ✅ (opcional) precargar elements + planned desde endpoint de formation
        // para que FormationTab los tenga ya (aunque Formation también puede recargarlo)
        try {
          dispatch(trainingContractActions.setElements([]))
          dispatch(trainingContractActions.setHours(0))

          const er = await getTrainingContractElementsWithId(contractId)
          if (cancelled) return

          const payload = er?.data ?? {}
          dispatch(trainingContractActions.setElements(payload.elements ?? []))
          dispatch(trainingContractActions.setHours(payload.planned ?? 0))
        } catch (e) {
          // no bloquees el general si falla formation
          console.error('Preload formation failed', e)
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trainingContractId, mode === 'create'])

  useEffect(() => {
    if (!open || mode === 'create' || !loadedContractData || isDirty) return

    const sc = loadedContractData
    setStudentFallback(buildStudentFallback(sc))
    skipCompanySyncRef.current = true

    reset({
      ...defaultValues,
      number_cfa: String(sc.number_cfa ?? contractNumber ?? ''),
      company: pickWithFallback(companiesList, sc.company_id, sc.company_name, sc.company?.name, sc.company),
      student_id: sc.student_id != null ? Number(sc.student_id) : null,

      occupation: pickWithFallback(occupationsList, sc.occupation_id, sc.occupation_name, sc.occupation?.name, sc.occupation),
      advisor: pickWithFallback(advisorsList, sc.advisor_id, sc.advisor_name, sc.advisor?.name, sc.advisor),
      provider: pickWithFallback(providersList, sc.provider_id, sc.provider_name, sc.provider?.name, sc.provider),
      province: pickWithFallback(provincesList, sc.province_id, sc.province_name, sc.province?.name, sc.province),

      company_tutor: String(sc.company_tutor ?? ''),
      company_tutor_dni: String(sc.company_tutor_dni ?? ''),
      center_of_work: String(sc.center_of_work ?? ''),

      disabled: Boolean(sc.disabled),
      youth_guarantee: Boolean(sc.youth_guarantee),
      social_exclusion: Boolean(sc.social_exclusion),

      specialty: Boolean(sc.specialty),
      professional_certificate: Boolean(sc.professional_certificate),
      bonification: Boolean(sc.bonification),

      beginning: String(sc.beginning ?? ''),
      end: String(sc.end ?? ''),
      beginning_formation: String(sc.beginning_formation ?? ''),
      end_formation: String(sc.end_formation ?? ''),

      annually_day_hours: sc.annually_day_hours ?? '',
      formation_hours: totalFormationHours ?? sc.formation_hours ?? '',

      percentage_first_year: sc.percentage_first_year ?? 0,
      bonus_hours_first_year: sc.bonus_hours_first_year ?? 0,
      formative_hours_first_year: sc.formative_hours_first_year ?? '',
      daily_hours_1: sc.daily_hours_1 ?? '',

      percentage_second_year: sc.percentage_second_year ?? 0,
      bonus_hours_second_year: sc.bonus_hours_second_year ?? 0,
      formative_hours_second_year: sc.formative_hours_second_year ?? '',
      daily_hours_2: sc.daily_hours_2 ?? '',

      training_schedule: String(sc.training_schedule ?? ''),
      working_hours: String(sc.working_hours ?? ''),
      complete_schedule: String(sc.complete_schedule ?? ''),

      monday: Boolean(sc.monday),
      tuesday: Boolean(sc.tuesday),
      wednesday: Boolean(sc.wednesday),
      thursday: Boolean(sc.thursday),
      friday: Boolean(sc.friday),
      saturday: Boolean(sc.saturday),
      sunday: Boolean(sc.sunday),

      training_contract_status: pickWithFallback(
        trainingContractStatusesList,
        sc.training_contract_status_id,
        sc.training_contract_status_name,
        sc.training_contract_status?.name,
        sc.training_contract_status
      ),
      on_leave_type: pickWithFallback(onLeaveTypesList, sc.on_leave_type_id, sc.on_leave_type_name, sc.on_leave_type?.name, sc.on_leave_type),
      on_leave_date: parseYmdToDate(sc.on_leave_date),

      collaborator: pickWithFallback(collaboratorsList, sc.collaborator_id, sc.collaborator_name, sc.collaborator?.name, sc.collaborator),
      observations: String(sc.observations ?? '')
    })
  }, [
    open,
    mode,
    loadedContractData,
    isDirty,
    reset,
    buildStudentFallback,
    pickWithFallback,
    defaultValues,
    contractNumber,
    totalFormationHours,
    companiesList,
    occupationsList,
    advisorsList,
    providersList,
    provincesList,
    trainingContractStatusesList,
    onLeaveTypesList,
    collaboratorsList
  ])

  // ✅ Botones “+”
  const handleCreateCompany = () => {
    dispatch(companyActions.setId(null))
    dispatch(companyActions.openModal({ mode: 'create', companyId: null }))
  }

  const handleCreateStudent = () => {
    dispatch(studentActions.setId(null))
    dispatch(studentActions.openStudentModal({ mode: 'create', studentId: null }))
  }

  const handleViewCompany = (companyId?: number | null) => {
    if (!companyId || !canReadCompanies) return

    dispatch(companyActions.setId(Number(companyId)))
    dispatch(companyActions.openModal({ mode: 'view', companyId: Number(companyId) }))
  }

  const handleViewStudent = (studentId?: number | null) => {
    if (!studentId || !canReadStudents) return

    dispatch(studentActions.setId(Number(studentId)))
    dispatch(studentActions.openStudentModal({ mode: 'view', studentId: Number(studentId) }))
  }

  // ✅ autoselect al crear
  useEffect(() => {
    if (!open) return
    if (!lastCreatedCompany?.id) return

    const option = {
      id: Number(lastCreatedCompany.id),
      name: String(lastCreatedCompany.name ?? ''),
      label: String(lastCreatedCompany.name ?? '')
    }
    setValue('company', option, { shouldDirty: true })

    if ((companyActions as any).clearLastCreatedCompany) dispatch((companyActions as any).clearLastCreatedCompany())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lastCreatedCompany?.id])

  useEffect(() => {
    if (!open) return
    if (!lastCreatedStudent?.id) return

    if (lastCreatedStudent.company_id) {
      const comp = companiesList.find(c => Number(c.id) === Number(lastCreatedStudent.company_id))
      if (comp) setValue('company', comp, { shouldDirty: true })
    }

    setValue('student_id', Number(lastCreatedStudent.id), { shouldDirty: true })
    setStudentFallback({
      id: Number(lastCreatedStudent.id),
      name: String(lastCreatedStudent.name ?? ''),
      label: getStudentFullName(lastCreatedStudent).full
    })

    if ((studentActions as any).clearLastCreatedStudent) dispatch((studentActions as any).clearLastCreatedStudent())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lastCreatedStudent?.id])

  const handleCalculateDates = async () => {
    try {
      const contractId = trainingContractId ?? loadedContractId
      if (!contractId) return

      const daily1 = Number(String(watch('daily_hours_1') ?? 0).replace(',', '.')) || 0
      const daily2 = Number(String(watch('daily_hours_2') ?? 0).replace(',', '.')) || 0

      const response = await calculateEndDates(contractId, daily1, daily2)
      const endFormation = response.data?.end_formation ?? response.data?.data?.end_formation

      if (!endFormation) {
        toast.error(t('Could not calculate end dates'))

        return
      }

      setValue('end_formation', String(endFormation), { shouldDirty: true })
      setValue('end', String(endFormation), { shouldDirty: true })
      toast.success(t('Dates calculated'))
    } catch (error) {
      handleError(error, logout)
    }
  }

  const onSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly || submitInFlightRef.current) return
    submitInFlightRef.current = true
    setSaving(true)

    try {
      const fd = new FormData()

      fd.append('number_cfa', data.number_cfa ?? '')
      fd.append('company_id', data.company?.id != null ? String(data.company.id) : '')
      fd.append('student_id', data.student_id != null ? String(data.student_id) : '')

      fd.append('company_tutor', data.company_tutor ?? '')
      fd.append('company_tutor_dni', data.company_tutor_dni ?? '')
      fd.append('center_of_work', data.center_of_work ?? '')

      fd.append('occupation_id', data.occupation?.id != null ? String(data.occupation.id) : '')
      fd.append('province_id', data.province?.id != null ? String(data.province.id) : '')
      fd.append('advisor_id', data.advisor?.id != null ? String(data.advisor.id) : '')
      fd.append('provider_id', data.provider?.id != null ? String(data.provider.id) : '')

      fd.append('disabled', data.disabled ? '1' : '0')
      fd.append('youth_guarantee', data.youth_guarantee ? '1' : '0')
      fd.append('social_exclusion', data.social_exclusion ? '1' : '0')

      fd.append('specialty', data.specialty ? '1' : '0')
      fd.append('professional_certificate', data.professional_certificate ? '1' : '0')
      fd.append('bonification', data.bonification ? '1' : '0')

      fd.append('beginning', data.beginning ?? '')
      fd.append('end', data.end ?? '')
      fd.append('beginning_formation', data.beginning_formation ?? '')
      fd.append('end_formation', data.end_formation ?? '')

      fd.append('annually_day_hours', String(data.annually_day_hours ?? ''))
      fd.append('formation_hours', String(data.formation_hours ?? ''))

      fd.append('percentage_first_year', String(data.percentage_first_year ?? 0))
      fd.append('percentage_second_year', String(data.percentage_second_year ?? 0))
      fd.append('bonus_hours_first_year', String(data.bonus_hours_first_year ?? 0))
      fd.append('bonus_hours_second_year', String(data.bonus_hours_second_year ?? 0))

      fd.append('formative_hours_first_year', String(data.formative_hours_first_year ?? ''))
      fd.append('formative_hours_second_year', String(data.formative_hours_second_year ?? 0))
      fd.append('daily_hours_1', String(data.daily_hours_1 ?? 0))
      fd.append('daily_hours_2', String(data.daily_hours_2 ?? 0))

      fd.append('training_schedule', data.training_schedule ?? '')
      fd.append('working_hours', data.working_hours ?? '')
      fd.append('complete_schedule', data.complete_schedule ?? '')

      fd.append('monday', data.monday ? '1' : '0')
      fd.append('tuesday', data.tuesday ? '1' : '0')
      fd.append('wednesday', data.wednesday ? '1' : '0')
      fd.append('thursday', data.thursday ? '1' : '0')
      fd.append('friday', data.friday ? '1' : '0')
      fd.append('saturday', data.saturday ? '1' : '0')
      fd.append('sunday', data.sunday ? '1' : '0')

      fd.append(
        'training_contract_status_id',
        data.training_contract_status?.id != null ? String(data.training_contract_status.id) : ''
      )
      fd.append('on_leave_type_id', data.on_leave_type?.id != null ? String(data.on_leave_type.id) : '')
      fd.append('on_leave_date', toYmd(data.on_leave_date))
      fd.append('collaborator_id', data.collaborator?.id != null ? String(data.collaborator.id) : '')

      fd.append('observations', data.observations ?? '')

      if (mode === 'create') {
        if (cloneId) fd.append('clone_id', String(cloneId))
        const res = await createTrainingContract(fd)
        const createdContract =
          res?.data?.data?.training_contract ?? res?.data?.data?.trainingContract ?? res?.data?.data ?? null
        const createdContractId = Number(createdContract?.id)

        if (!Number.isFinite(createdContractId) || createdContractId <= 0) {
          throw new Error('Created training contract id not found')
        }

        setLoadedContractId(createdContractId)
        setLoadedContractData(createdContract)
        dispatch(
          trainingContractActions.openModal({
            mode: 'edit',
            trainingContractId: createdContractId
          })
        )
        toast.success(res.data?.message ?? t('Saved'))
        dispatch(generalActions.addFilterButtonClickCount())
      } else if (mode === 'edit' && trainingContractId) {
        const res = await editTrainingContract(trainingContractId, fd)
        toast.success(res.data?.message ?? t('Saved'))
        dispatch(generalActions.addFilterButtonClickCount())
      }
    } catch (e) {
      handleError(e, logout)
    } finally {
      submitInFlightRef.current = false
      setSaving(false)
    }
  }

  return (
    <DatePickerWrapper>
      <Fragment>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Training contract information')}</Typography>
        </Box>

        <Grid container spacing={5}>
          <Grid item xs={12} md={3}>
            <Controller
              name='number_cfa'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('CFA number')} {...field} disabled />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='company'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={companiesList}
                  getOptionLabel={getOptionLabelSafe}
                  isOptionEqualToValue={(o, v) => Number(o?.id) === Number(v?.id)}
                  disabled={disabledAll}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Company')}
                      error={Boolean(errors.company)}
                      helperText={(errors.company as any)?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <InputAdornment position='end' sx={{ ml: 1 }}>
                            {canReadCompanies && field.value?.id ? (
                              <IconButton
                                size='small'
                                onClick={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleViewCompany(field.value?.id ?? null)
                                }}
                                disabled={disabledAll}
                              >
                                <Icon icon='tabler:eye' fontSize={18} />
                              </IconButton>
                            ) : null}
                            <IconButton
                              size='small'
                              onClick={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleCreateCompany()
                              }}
                              disabled={disabledAll}
                            >
                              <Icon icon='tabler:plus' fontSize={18} />
                            </IconButton>
                            {params.InputProps.endAdornment}
                          </InputAdornment>
                        )
                      }}
                      inputProps={{ ...params.inputProps, readOnly: disabledAll }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='company_tutor'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Company tutor')} {...field} disabled={disabledAll} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='company_tutor_dni'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Company tutor DNI')} {...field} disabled={disabledAll} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='center_of_work'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Work center')} {...field} disabled={disabledAll} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='advisor'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={advisorsList}
                  getOptionLabel={getOptionLabelSafe}
                  isOptionEqualToValue={(o, v) => Number(o?.id) === Number(v?.id)}
                  disabled={disabledAll}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Advisory')}
                      inputProps={{ ...params.inputProps, readOnly: disabledAll }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='provider'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={providersList}
                  getOptionLabel={getOptionLabelSafe}
                  isOptionEqualToValue={(o, v) => Number(o?.id) === Number(v?.id)}
                  disabled={disabledAll}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Provider')}
                      inputProps={{ ...params.inputProps, readOnly: disabledAll }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='province'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={provincesList}
                  getOptionLabel={getOptionLabelSafe}
                  isOptionEqualToValue={(o, v) => Number(o?.id) === Number(v?.id)}
                  disabled={disabledAll}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Province')}
                      inputProps={{ ...params.inputProps, readOnly: disabledAll }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='student_id'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={selectedStudentOption}
                  onChange={(_, v) => field.onChange(v ? Number(v.id) : null)}
                  options={filteredStudentsList}
                  getOptionLabel={getOptionLabelSafe}
                  isOptionEqualToValue={(o, v) => Number(o?.id) === Number(v?.id)}
                  disabled={disabledAll || !companySelected || (mode !== 'create' && loading)}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Student')}
                      error={Boolean(errors.student_id)}
                      helperText={(errors.student_id as any)?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <InputAdornment position='end' sx={{ ml: 1 }}>
                            {canReadStudents && field.value ? (
                              <IconButton
                                size='small'
                                onClick={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleViewStudent(Number(field.value))
                                }}
                                disabled={disabledAll}
                              >
                                <Icon icon='tabler:eye' fontSize={18} />
                              </IconButton>
                            ) : null}
                            <IconButton
                              size='small'
                              onClick={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleCreateStudent()
                              }}
                              disabled={disabledAll}
                            >
                              <Icon icon='tabler:plus' fontSize={18} />
                            </IconButton>
                            {params.InputProps.endAdornment}
                          </InputAdornment>
                        )
                      }}
                      inputProps={{ ...params.inputProps, readOnly: disabledAll || !companySelected }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='occupation'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={occupationsList}
                  getOptionLabel={getOptionLabelSafe}
                  isOptionEqualToValue={(o, v) => Number(o?.id) === Number(v?.id)}
                  disabled={disabledAll}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Occupation')}
                      inputProps={{ ...params.inputProps, readOnly: disabledAll }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='disabled'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Disability')}
                  control={
                    <Checkbox
                      checked={Boolean(field.value)}
                      onChange={(_, c) => field.onChange(c)}
                      disabled={disabledAll}
                    />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='youth_guarantee'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Youth guarantee')}
                  control={
                    <Checkbox
                      checked={Boolean(field.value)}
                      onChange={(_, c) => field.onChange(c)}
                      disabled={disabledAll}
                    />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='social_exclusion'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Social exclusion')}
                  control={
                    <Checkbox
                      checked={Boolean(field.value)}
                      onChange={(_, c) => field.onChange(c)}
                      disabled={disabledAll}
                    />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='specialty'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Specialty')}
                  control={
                    <Checkbox
                      checked={Boolean(field.value)}
                      onChange={(_, c) => field.onChange(c)}
                      disabled={disabledAll}
                    />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='professional_certificate'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Professional certificate')}
                  control={
                    <Checkbox
                      checked={Boolean(field.value)}
                      onChange={(_, c) => field.onChange(c)}
                      disabled={disabledAll}
                    />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='bonification'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Bonified')}
                  control={
                    <Checkbox
                      checked={Boolean(field.value)}
                      onChange={(_, c) => field.onChange(c)}
                      disabled={disabledAll}
                    />
                  }
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 6, mt: 10 }}>
          <Typography variant='h6'>{t('Itinerary')}</Typography>
        </Box>

        <Grid container spacing={5}>
          <Grid item xs={12} md={3}>
            <Controller
              name='beginning'
              control={control}
              render={({ field }) => {
                const selected = parseYmdToDate(field.value)

                return (
                  <DatePicker
                    id='beginning'
                    selected={selected}
                    onChange={(date: Date | null) => {
                      const next = date ? dayjs(date).format('YYYY-MM-DD') : ''
                      field.onChange(next)

                      const end = watch('end')
                      if (date && end && dayjs(end).isBefore(dayjs(next), 'day')) {
                        setValue('end', next, { shouldDirty: true })
                      }

                      const bf = watch('beginning_formation')
                      if (date && bf && dayjs(bf).isBefore(dayjs(next), 'day')) {
                        setValue('beginning_formation', next, { shouldDirty: true })
                      }
                    }}
                    dateFormat='dd/MM/yyyy'
                    calendarStartDay={1}
                    locale={datePickerLocale(i18n.language)}
                    disabled={disabledAll}
                    showMonthDropdown
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                    popperClassName='mui-datepicker-popper'
                    isClearable={!disabledAll}
                    customInput={
                      <CustomDateInput
                        label={t('Contract start date')}
                        error={Boolean(errors.beginning)}
                        helperText={(errors.beginning as any)?.message}
                        disabled={disabledAll}
                      />
                    }
                  />
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='end'
              control={control}
              render={({ field }) => {
                const selected = parseYmdToDate(field.value)
                const minDate = parseYmdToDate(watch('beginning'))

                return (
                  <DatePicker
                    id='end'
                    selected={selected}
                    minDate={minDate ?? undefined}
                    onChange={(date: Date | null) => field.onChange(date ? dayjs(date).format('YYYY-MM-DD') : '')}
                    dateFormat='dd/MM/yyyy'
                    calendarStartDay={1}
                    locale={datePickerLocale(i18n.language)}
                    disabled={disabledAll}
                    showMonthDropdown
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                    popperClassName='mui-datepicker-popper'
                    isClearable={!disabledAll}
                    customInput={
                      <CustomDateInput
                        label={t('Contract end date')}
                        error={Boolean(errors.end)}
                        helperText={(errors.end as any)?.message}
                        disabled={disabledAll}
                      />
                    }
                  />
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='beginning_formation'
              control={control}
              render={({ field }) => {
                const selected = parseYmdToDate(field.value)
                const minDate = parseYmdToDate(watch('beginning'))

                return (
                  <DatePicker
                    id='beginning_formation'
                    selected={selected}
                    minDate={minDate ?? undefined}
                    onChange={(date: Date | null) => {
                      const next = date ? dayjs(date).format('YYYY-MM-DD') : ''
                      field.onChange(next)

                      const endFormation = watch('end_formation')
                      if (date && endFormation && dayjs(endFormation).isBefore(dayjs(next), 'day')) {
                        setValue('end_formation', next, { shouldDirty: true })
                      }
                    }}
                    dateFormat='dd/MM/yyyy'
                    calendarStartDay={1}
                    locale={datePickerLocale(i18n.language)}
                    disabled={disabledAll}
                    showMonthDropdown
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                    popperClassName='mui-datepicker-popper'
                    isClearable={!disabledAll}
                    customInput={
                      <CustomDateInput
                        label={t('Training start date')}
                        error={Boolean(errors.beginning_formation)}
                        helperText={(errors.beginning_formation as any)?.message}
                        disabled={disabledAll}
                      />
                    }
                  />
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='end_formation'
              control={control}
              render={({ field }) => {
                const selected = parseYmdToDate(field.value)
                const minDate = parseYmdToDate(watch('beginning_formation'))

                return (
                  <DatePicker
                    id='end_formation'
                    selected={selected}
                    minDate={minDate ?? undefined}
                    onChange={(date: Date | null) => field.onChange(date ? dayjs(date).format('YYYY-MM-DD') : '')}
                    dateFormat='dd/MM/yyyy'
                    calendarStartDay={1}
                    locale={datePickerLocale(i18n.language)}
                    disabled={disabledAll}
                    showMonthDropdown
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                    popperClassName='mui-datepicker-popper'
                    isClearable={!disabledAll}
                    customInput={
                      <CustomDateInput
                        label={t('Training end date')}
                        error={Boolean(errors.end_formation)}
                        helperText={(errors.end_formation as any)?.message}
                        disabled={disabledAll}
                      />
                    }
                  />
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='annually_day_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Total contract hours')}
                  {...field}
                  disabled={disabledAll}
                  onFocus={() => setTooltipOpen(true)}
                  onBlur={() => setTooltipOpen(false)}
                />
              )}
            />
            {mode === 'edit' && (
              <Tooltip
                open={tooltipOpen}
                title={t('If the contract is less than a year, set annual hours for the months worked.')}
              >
                <span />
              </Tooltip>
            )}
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='formation_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Planned training hours')} {...field} disabled />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6} />

          <Grid item xs={12} md={3}>
            <Controller
              name='percentage_first_year'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Percentage 1st year')}
                  {...field}
                  disabled={disabledAll}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name='bonus_hours_first_year'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Bonus hours 1st year')} {...field} disabled />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name='formative_hours_first_year'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Real training hours 1st year')}
                  {...field}
                  disabled={disabledAll}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name='daily_hours_1'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Daily hours 1st year')}
                  {...field}
                  disabled={disabledAll}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='percentage_second_year'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Percentage 2nd year')}
                  {...field}
                  disabled={disabledAll}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name='bonus_hours_second_year'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Bonus hours 2nd year')} {...field} disabled />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name='formative_hours_second_year'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Real training hours 2nd year')}
                  {...field}
                  disabled={disabledAll}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name='daily_hours_2'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Daily hours 2nd year')}
                  {...field}
                  disabled={disabledAll}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='training_schedule'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Training schedule')} {...field} disabled={disabledAll} />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name='working_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Working hours')} {...field} disabled={disabledAll} />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name='complete_schedule'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Complete schedule')} {...field} disabled={disabledAll} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Button
              variant='tonal'
              onClick={handleCalculateDates}
              disabled={!(trainingContractId ?? loadedContractId) || disabledAll}
              startIcon={<Icon icon='tabler:calculator' fontSize={18} />}
            >
              {t('Calculate end dates')}
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 10 }}>
          <Grid container spacing={5}>
            <Grid item xs={12} sx={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => (
                <Controller
                  key={day}
                  name={day}
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      label={t(day.charAt(0).toUpperCase() + day.slice(1))}
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(_, c) => field.onChange(c)}
                          disabled={disabledAll}
                        />
                      }
                    />
                  )}
                />
              ))}
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 6, mt: 10 }}>
          <Typography variant='h6'>{t('Contract status')}</Typography>
        </Box>

        <Grid container spacing={5}>
          <Grid item xs={12} md={3}>
            <Controller
              name='training_contract_status'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={trainingContractStatusesList}
                  getOptionLabel={getOptionLabelSafe}
                  isOptionEqualToValue={(o, v) => Number(o?.id) === Number(v?.id)}
                  disabled={disabledAll}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Status')}
                      inputProps={{ ...params.inputProps, readOnly: disabledAll }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='on_leave_type'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={onLeaveTypesList}
                  getOptionLabel={getOptionLabelSafe}
                  isOptionEqualToValue={(o, v) => Number(o?.id) === Number(v?.id)}
                  disabled={disabledAll}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('On leave')}
                      inputProps={{ ...params.inputProps, readOnly: disabledAll }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='on_leave_date'
              control={control}
              render={({ field }) => (
                <DatePicker
                  id='on_leave_date'
                  selected={field.value}
                  onChange={(date: Date | null) => field.onChange(date)}
                  dateFormat='dd/MM/yyyy'
                  calendarStartDay={1}
                  locale={datePickerLocale(i18n.language)}
                  disabled={disabledAll}
                  showMonthDropdown
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={15}
                  popperClassName='mui-datepicker-popper'
                  isClearable={!disabledAll}
                  customInput={<CustomDateInput label={t('On leave date')} disabled={disabledAll} />}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='collaborator'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={collaboratorsList}
                  getOptionLabel={getOptionLabelSafe}
                  isOptionEqualToValue={(o, v) => Number(o?.id) === Number(v?.id)}
                  disabled={disabledAll}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Collaborator')}
                      inputProps={{ ...params.inputProps, readOnly: disabledAll }}
                    />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 4, mt: 10 }}>
          <Typography variant='h6'>{t('Observations')}</Typography>
        </Box>

        <Controller
          name='observations'
          control={control}
          render={({ field }) => (
            <CustomTextField fullWidth multiline minRows={4} maxRows={10} {...field} disabled={disabledAll} />
          )}
        />

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

export default TrainingContractGeneralTab
