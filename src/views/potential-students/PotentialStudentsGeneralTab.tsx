import React, { forwardRef, Fragment, useContext, useEffect, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, FormHelperText, Grid, Switch, Typography, FormControlLabel } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'

import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'
import { createPotentialStudent, editPotentialStudent, getPotentialStudent, studentCheckDni } from 'src/api/api'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { DateType } from 'src/types/forms/reactDatepickerTypes'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useDispatch } from 'react-redux'
import { potentialStudentActions } from 'src/reducers/students/PotentialStudentReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'

type TranslationFunction = (key: string) => string
type List = { id: number; name: string }
type Mode = 'view' | 'edit' | 'create'

const hasStudentLikeFields = (value: any) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = [
    'name',
    'surname',
    'first_name',
    'last_name',
    'dni',
    'email',
    'telephone',
    'phone',
    'mobile',
    'company_id'
  ]

  return keys.some(k => value[k] !== undefined && value[k] !== null && String(value[k]).trim() !== '')
}

const findStudentLikePayload = (value: any, depth = 0): any => {
  if (depth > 5 || value == null) return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStudentLikePayload(item, depth + 1)
      if (found) return found
    }

    return null
  }
  if (typeof value !== 'object') return null
  if (hasStudentLikeFields(value)) return value

  const directKeys = ['potential_student', 'potentialStudent', 'student', 'data', 'result', 'item']
  for (const key of directKeys) {
    const found = findStudentLikePayload((value as any)[key], depth + 1)
    if (found) return found
  }

  for (const child of Object.values(value)) {
    const found = findStudentLikePayload(child, depth + 1)
    if (found) return found
  }

  return null
}

const pickPotentialStudentPayload = (res: any) => {
  const directCandidates = [
    res?.data?.data?.potential_student,
    res?.data?.data?.potentialStudent,
    res?.data?.potential_student,
    res?.data?.potentialStudent,
    res?.data?.data?.student,
    res?.data?.student,
    res?.data?.data,
    res?.data
  ]

  for (const candidate of directCandidates) {
    const found = findStudentLikePayload(candidate)
    if (found) return found
  }

  return null
}

const normalizeStr = (value: any) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const parseDateValue = (value: any): Date | null => {
  if (!value) return null
  const raw = String(value).trim()
  if (!raw) return null

  const onlyDate = raw.slice(0, 10)
  const isoParsed = new Date(`${onlyDate}T00:00:00.000Z`)
  if (!Number.isNaN(isoParsed.getTime())) return isoParsed

  const match = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  const fallback = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`)

  return Number.isNaN(fallback.getTime()) ? null : fallback
}

const pickFirstValue = (...values: any[]) => {
  for (const value of values) {
    if (value === undefined || value === null) continue
    if (typeof value === 'string' && value.trim() === '') continue

    return value
  }

  return ''
}

const pickByIdOrName = (list: List[], idCandidate: any, nameCandidate: any) => {
  const id = Number(idCandidate)
  if (Number.isFinite(id) && id > 0) {
    const byId = list.find(x => Number(x.id) === id)
    if (byId) return byId
  }

  const targetName = normalizeStr(nameCandidate)
  if (!targetName) return null

  const byName = list.find(x => normalizeStr(x.name) === targetName)
  if (byName) return byName

  return { id: 0, name: String(nameCandidate).trim() }
}

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    name: yup.string().required(t('Name is required')),
    surname: yup.string().required(t('Surname is required')),

    dni: yup.string().required(t('DNI is required')),
    telephone: yup.string().required(t('Telephone is required')),

    email: yup.string().email(t('Invalid email')).required(t('Email is required')),

    user: yup.string().required(t('User is required')),

    password: yup.string().required(t('Password is required')),

    // los switches ya vienen boolean, no hace falta validar fuerte
    disabled: yup.boolean().required(),
    active: yup.boolean().required(),

    // company y level_study son objetos o null (en el back se manda company_id / level_study_id)
    company: yup.mixed().nullable(),
    level_study: yup.mixed().nullable()
  })

type FormValues = {
  name: string
  surname: string
  dni?: string
  date_of_birth?: Date | null
  telephone?: string
  email?: string
  user?: string
  password?: string
  direction?: string
  population?: string
  population_code?: string
  post_code?: string
  province: List | null
  nationality: string
  nationality_code: string
  company: List | null
  c_quote: string
  regimen: string
  social_security_number: string
  level_study: List | null
  annual_gross_salary: number | string
  annual_hours: number | string
  hourly_cost_worker_gross: number | string
  iban: string
  quote_group: List | null
  professional_category: List | null
  disabled: boolean
  active: boolean
  observation: string
  legal_guardian_name: string
  legal_guardian_dni: string
}

interface CustomInputProps {
  value?: string
  label: string
  onClick?: () => void
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(({ label, ...props }, ref) => {
  return <CustomTextField fullWidth inputRef={ref} label={label} {...props} sx={{ width: '100%' }} />
})
CustomInput.displayName = 'CustomInput'

interface PotentialStudentsGeneralTabProps {
  open: boolean
  mode: Mode
  potentialStudentId: number | null
  onLoadedStudent?: (student: any) => void
  onClose?: () => void
}

const PotentialStudentsGeneralTab: React.FC<PotentialStudentsGeneralTabProps> = ({
  open,
  mode,
  potentialStudentId,
  onLoadedStudent,
  onClose
}) => {
  const { t, i18n } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()
  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canReadCompanies = Array.isArray(userPermissions) && userPermissions.includes('read.companies')
  const showCompanyEye = Boolean(potentialStudentId) && canReadCompanies

  // LISTAS
  const provinces = useSelector((state: RootState) => state.province.provinces) as List[]
  const provincesList = useMemo<List[]>(() => (Array.isArray(provinces) ? provinces : []), [provinces])

  const companies = useSelector((state: RootState) => state.company.companies) as List[]
  const companiesList = useMemo<List[]>(() => (Array.isArray(companies) ? companies : []), [companies])

  const levelStudies = useSelector((state: RootState) => state.levelStudy.levelStudies) as List[]
  const levelStudiesList = useMemo<List[]>(() => (Array.isArray(levelStudies) ? levelStudies : []), [levelStudies])

  const quoteGroups = useSelector((state: RootState) => state.quoteGroup.quoteGroups) as List[]
  const quoteGroupsList = useMemo<List[]>(() => (Array.isArray(quoteGroups) ? quoteGroups : []), [quoteGroups])

  const professionalCategories = useSelector(
    (state: RootState) => state.professionalCategory.professionalCategories
  ) as List[]
  const professionalCategoriesList = useMemo<List[]>(
    () => (Array.isArray(professionalCategories) ? professionalCategories : []),
    [professionalCategories]
  )

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loadingStudent, setLoadingStudent] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      surname: '',
      dni: '',
      date_of_birth: null,
      telephone: '',
      email: '',
      user: '',
      password: '',
      direction: '',
      population: '',
      population_code: '',
      post_code: '',
      province: null,
      nationality: '',
      nationality_code: '',
      company: null,
      c_quote: '',
      regimen: '',
      social_security_number: '',
      level_study: null,
      annual_gross_salary: '',
      annual_hours: '',
      hourly_cost_worker_gross: '',
      iban: '',
      quote_group: null,
      professional_category: null,
      disabled: false,
      active: true,
      observation: '',
      legal_guardian_name: '',
      legal_guardian_dni: ''
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

  // ✅ CARGA DEL POTENCIAL (sin dependencias que provoquen loops)
  useEffect(() => {
    if (!open) {
      setLoadingStudent(false)

      return
    }

    if (mode === 'create') {
      reset(defaultValues)
      setLoadingStudent(false)

      return
    }

    if (!potentialStudentId) {
      setLoadingStudent(false)

      return
    }

    let cancelled = false

    const load = async () => {
      setLoadingStudent(true)
      try {
        const res = await getPotentialStudent(potentialStudentId)
        console.log(res)
        if (cancelled) return

        const s = pickPotentialStudentPayload(res)
        if (!s) throw new Error('Potential student payload not found')

        onLoadedStudent?.(s)

        const parsedDob: DateType = parseDateValue(s.date_of_birth ?? s.birth_date ?? s.birthdate)

        const provinceIdFromApi =
          s.province_id ??
          s.provinceId ??
          (typeof s.province === 'object' ? s.province?.id : null) ??
          (typeof s.province === 'object' ? s.province?.value : null)
        const provinceNameFromApi =
          typeof s.province === 'string'
            ? s.province
            : s.province?.name ?? s.province_name ?? s.provinceName ?? s.province?.label ?? null
        const selectedProvince = pickByIdOrName(provincesList, provinceIdFromApi, provinceNameFromApi)

        const companyIdFromApi =
          s.company_id ??
          s.companyId ??
          (typeof s.company === 'object' ? s.company?.id : null) ??
          (typeof s.company === 'object' ? s.company?.value : null)
        const companyNameFromApi =
          typeof s.company === 'string'
            ? s.company
            : s.company?.name ?? s.company_name ?? s.companyName ?? s.company?.label ?? null
        const selectedCompany = pickByIdOrName(companiesList, companyIdFromApi, companyNameFromApi)

        const levelStudyIdFromApi =
          s.level_study_id ??
          s.levelStudyId ??
          s.study_level_id ??
          (typeof s.level_study === 'object' ? s.level_study?.id : null) ??
          (typeof s.level_study === 'object' ? s.level_study?.value : null)
        const levelStudyNameFromApi =
          typeof s.level_study === 'string'
            ? s.level_study
            : s.level_study?.name ??
              s.level_study_name ??
              s.levelStudyName ??
              s.study_level ??
              s.level_study?.label ??
              null
        const selectedLevelStudy = pickByIdOrName(levelStudiesList, levelStudyIdFromApi, levelStudyNameFromApi)

        const quoteGroupIdFromApi =
          s.quote_group_id ??
          s.quoteGroupId ??
          (typeof s.quote_group === 'object' ? s.quote_group?.id : null) ??
          (typeof s.quote_group === 'object' ? s.quote_group?.value : null)
        const quoteGroupNameFromApi =
          typeof s.quote_group === 'string'
            ? s.quote_group
            : s.quote_group?.name ?? s.quote_group_name ?? s.quoteGroupName ?? s.quote_group?.label ?? null
        const selectedQuoteGroup = pickByIdOrName(quoteGroupsList, quoteGroupIdFromApi, quoteGroupNameFromApi)

        const professionalCategoryIdFromApi =
          s.professional_category_id ??
          s.professionalCategoryId ??
          (typeof s.professional_category === 'object' ? s.professional_category?.id : null)
        const professionalCategoryNameFromApi =
          typeof s.professional_category === 'string'
            ? s.professional_category
            : s.professional_category?.name ??
              s.professional_category_name ??
              s.professionalCategoryName ??
              s.professional_category?.label ??
              null
        const selectedProfessionalCategory = pickByIdOrName(
          professionalCategoriesList,
          professionalCategoryIdFromApi,
          professionalCategoryNameFromApi
        )

        // ✅ vienen como 1/0 => boolean
        const disableBool = String(s.disabled ?? '1') === '0'
        const activeBool = String(s.active ?? '1') === '1'

        reset({
          name: pickFirstValue(s.name, s.first_name, s.firstname),
          surname: pickFirstValue(s.surname, s.last_name, s.lastname),
          dni: pickFirstValue(s.dni, s.nif),
          date_of_birth: (parsedDob as Date | null) ?? null,
          telephone: pickFirstValue(s.telephone, s.phone, s.mobile),
          email: pickFirstValue(s.email, s.mail),
          user: pickFirstValue(s.user, s.username, s.email, s.mail),
          password: pickFirstValue(s.password, s.dni, s.nif),
          direction: pickFirstValue(s.direction, s.address),
          population: pickFirstValue(s.population, s.city),
          population_code: pickFirstValue(s.population_code, s.city_code),
          post_code: pickFirstValue(s.post_code, s.postal_code, s.zip_code, s.zip),
          province: selectedProvince,
          nationality: pickFirstValue(s.nationality, s.country),
          nationality_code: pickFirstValue(s.nationality_code, s.country_code),
          company: selectedCompany,
          c_quote: pickFirstValue(s.c_quote, s.quote),
          regimen: pickFirstValue(s.regimen),
          social_security_number: pickFirstValue(s.social_security_number, s.ss_number, s.nss),
          level_study: selectedLevelStudy,
          annual_gross_salary: pickFirstValue(s.annual_gross_salary, s.gross_salary),
          annual_hours: pickFirstValue(s.annual_hours, s.hours_per_year),
          hourly_cost_worker_gross: pickFirstValue(s.hourly_cost_worker_gross, s.hourly_cost),
          iban: pickFirstValue(s.iban, s.bank_account),
          quote_group: selectedQuoteGroup,
          professional_category: selectedProfessionalCategory,
          disabled: disableBool,
          active: activeBool,
          observation: pickFirstValue(s.observation, s.comment, s.comments),
          legal_guardian_name: pickFirstValue(s.legal_guardian_name, s.tutor_name),
          legal_guardian_dni: pickFirstValue(s.legal_guardian_dni, s.tutor_dni)
        })
      } catch (error) {
        console.log(error)
        if (!cancelled) handleError(error, logout)
      } finally {
        if (!cancelled) setLoadingStudent(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, potentialStudentId])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return

    // ✅ 1) Check DNI antes de guardar (bloquea el guardado si existe)
    try {
      const dni = (data.dni ?? '').trim()

      // Si DNI puede venir vacío y NO quieres validar, deja este if.
      // Si DNI es obligatorio, puedes quitarlo.
      if (dni.length > 0) {
        const check = await studentCheckDni({ dni: dni, id: '' })

        if (check.data?.exists) {
          toast.error(t('DNI ya en uso'))

          // si usas redux flag:
          // dispatch(potentialStudentActions.setDniExist(true))
          return // 🔴 corta aquí, no guarda
        }

        // dispatch(potentialStudentActions.setDniExist(false))
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
      formData.append('name', data.name)
      formData.append('surname', data.surname)
      formData.append('dni', data.dni ?? '')
      formData.append('telephone', data.telephone ?? '')
      formData.append('email', data.email ?? '')
      formData.append('user', data.user ?? '')
      formData.append('password', data.password ?? '')
      formData.append('direction', data.direction ?? '')
      formData.append('population', data.population ?? '')
      formData.append('population_code', data.population_code ?? '')
      formData.append('post_code', data.post_code ?? '')
      formData.append('nationality', data.nationality ?? '')
      formData.append('nationality_code', data.nationality_code ?? '')
      formData.append('c_quote', data.c_quote ?? '')
      formData.append('regimen', data.regimen ?? '')
      formData.append('social_security_number', data.social_security_number ?? '')
      formData.append('annual_gross_salary', String(data.annual_gross_salary ?? ''))
      formData.append('annual_hours', String(data.annual_hours ?? ''))
      formData.append('hourly_cost_worker_gross', String(data.hourly_cost_worker_gross ?? ''))
      formData.append('iban', data.iban ?? '')
      formData.append('observation', data.observation ?? '')
      formData.append('legal_guardian_name', data.legal_guardian_name ?? '')
      formData.append('legal_guardian_dni', data.legal_guardian_dni ?? '')

      formData.append('province_id', Number(data.province?.id) > 0 ? String(data.province?.id) : '')
      if (Number(data.company?.id) > 0) {
        formData.append('company_id', String(data.company.id))
      }
      if (Number(data.level_study?.id) > 0) {
        formData.append('level_study_id', String(data.level_study.id))
      }
      formData.append('quote_group_id', Number(data.quote_group?.id) > 0 ? String(data.quote_group?.id) : '')
      formData.append(
        'professional_category_id',
        Number(data.professional_category?.id) > 0 ? String(data.professional_category?.id) : ''
      )

      formData.append('disabled', data.disabled ? '1' : '0')
      formData.append('active', data.active ? '1' : '0')

      if (data.date_of_birth instanceof Date && !isNaN(data.date_of_birth.getTime())) {
        const yyyy = data.date_of_birth.getFullYear()
        const mm = String(data.date_of_birth.getMonth() + 1).padStart(2, '0')
        const dd = String(data.date_of_birth.getDate()).padStart(2, '0')
        formData.append('date_of_birth', `${yyyy}-${mm}-${dd}`)
      } else {
        formData.append('date_of_birth', '')
      }

      if (mode === 'create') {
        const response = await createPotentialStudent(formData)

        if (response.data?.success) {
          toast.success(response.data.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())

          const newIdRaw =
            response.data?.data?.potential_student?.id ?? response.data?.data?.student?.id ?? response.data?.data?.id
          const newId = newIdRaw != null ? Number(newIdRaw) : null

          if (newId && !Number.isNaN(newId)) {
            dispatch(potentialStudentActions.setId(newId))
            dispatch(potentialStudentActions.openModal({ mode: 'edit', studentId: newId }))
          }
        }
      } else if (mode === 'edit' && potentialStudentId) {
        const response = await editPotentialStudent(potentialStudentId, formData)
        if (response.data?.success) {
          toast.success(response.data.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
        }
      }
    } catch (error) {
      console.log(error)
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  const disabled = readOnly || loadingStudent || saving

  // ✅ helper: Autocomplete inputProps para que NO abra en disabled, y SÍ abra al cambiar a edit
  const autoCompleteInputProps = (params: any) => ({
    ...params.inputProps,
    readOnly: disabled
  })

  const openCompanyModal = (companyId?: number | null) => {
    // si quieres abrir viendo esa empresa
    if (companyId) dispatch(companyActions.setId(companyId))

    // abre modal en modo view
    dispatch(companyActions.openModal({ mode: 'view', companyId: companyId ?? null }))
  }

  return (
    <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Student data')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* NAME (required) */}
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

          {/* SURNAME (required) */}
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

          {/* DNI (required) */}
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

          {/* DATE OF BIRTH (optional) */}
          <Grid item xs={12} sm={3}>
            <Controller
              name='date_of_birth'
              control={control}
              render={({ field }) => (
                <DatePicker
                  isClearable
                  dateFormat='dd/MM/yyyy'
                  selected={(field.value as DateType) ?? null}
                  onChange={date => field.onChange(date)}
                  customInput={<CustomInput label={t('Date of Birth')} />}
                  calendarStartDay={1}
                  locale={i18n.language}
                  showMonthDropdown
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={15}
                  popperClassName='mui-datepicker-popper'
                  withPortal
                  disabled={disabled}
                />
              )}
            />
            {errors.date_of_birth && (
              <FormHelperText error>{String(errors.date_of_birth.message ?? '')}</FormHelperText>
            )}
          </Grid>

          {/* PROVINCE (optional) */}
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

          {/* TELEPHONE (required) */}
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

          {/* EMAIL (required) */}
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

          {/* USER (required) */}
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

          {/* PASSWORD (required en create, opcional en edit si lo pusiste así en yup) */}
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

          {/* ADDRESS (optional) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='direction'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Direction')}
                  placeholder={t('Direction')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          {/* POPULATION (optional) */}
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

          {/* POPULATION CODE (optional) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='population_code'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Population Code')}
                  placeholder={t('Population Code')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          {/* POST CODE (optional) */}
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

          {/* NATIONALITY (optional) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='nationality'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Nationality')}
                  placeholder={t('Nationality')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          {/* NATIONALITY CODE (optional) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='nationality_code'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Nationality Code')}
                  placeholder={t('Nationality Code')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 6, mt: 6 }}>
          <Typography variant='h6'>{t('Laboral data')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* COMPANY (nullable|exists) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='company'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  options={companiesList}
                  getOptionLabel={option => option?.name ?? ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component='span' sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                            {t('Company')}
                          </Typography>

                          {showCompanyEye && (
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
                          )}
                        </Box>
                      }
                      placeholder={t('Company')}
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
              name='c_quote'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('C Quote')}
                  placeholder={t('C Quote')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='regimen'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Regimen')}
                  placeholder={t('Regimen')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='social_security_number'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Social security number')}
                  placeholder={t('Social security number')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          {/* LEVEL STUDY (nullable|exists) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='level_study'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  options={levelStudiesList}
                  getOptionLabel={option => option?.name ?? ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Level Study')}
                      placeholder={t('Level Study')}
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
              name='annual_gross_salary'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Annual Gross Salary')}
                  placeholder={t('Annual Gross Salary')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='annual_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Annual Hours')}
                  placeholder={t('Annual Hours')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='hourly_cost_worker_gross'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Hourly Cost Worker Gross')}
                  placeholder={t('Hourly Cost Worker Gross')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='iban'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Iban')} placeholder={t('Iban')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='quote_group'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  options={quoteGroupsList}
                  getOptionLabel={option => option?.name ?? ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Quote Group')}
                      placeholder={t('Quote Group')}
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
              name='legal_guardian_name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Legal Guardian Name')}
                  placeholder={t('Legal Guardian Name')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='legal_guardian_dni'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Legal Guardian DNI')}
                  placeholder={t('Legal Guardian DNI')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='professional_category'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  options={professionalCategoriesList}
                  getOptionLabel={option => option?.name ?? ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Professional Category')}
                      placeholder={t('Professional Category')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>

        <Grid container spacing={5} sx={{ mt: 2 }}>
          {/* DISABLED (required numeric en back, aquí boolean) */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='disabled'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Disabled')}
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

          {/* ACTIVE (required numeric en back, aquí boolean) */}
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

          {/* OBSERVATION (optional) */}
          <Grid item xs={12}>
            <Controller
              name='observation'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={6}
                  label={t('Observation')}
                  placeholder={t('Observation')}
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
            <Button variant='contained' type='submit' disabled={saving || loadingStudent}>
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

      {open && !saving && loadingStudent && <SavingDialog labelKey='Processing Data' />}

      {open && saving && <SavingDialog />}
    </Fragment>
  )
}

export default PotentialStudentsGeneralTab
