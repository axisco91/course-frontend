import React, { Fragment, forwardRef, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, FormControlLabel, FormHelperText, Grid, Switch, Typography } from '@mui/material'
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
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'

// ✅ course APIs (ajusta a tus exports reales)
import { createCourse, editCourse, getCourse, getNextFormativeAction } from 'src/api/api'
import { courseActions } from 'src/reducers/courses/CourseReducer'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string }

const renderListOption = (props: React.HTMLAttributes<HTMLLIElement>, option: List) => (
  <li {...props} key={option.id}>
    {option.name}
  </li>
)

const toInputDate = (value: unknown) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  if (/^\d{4}-\d{2}-\d{2}[T\s]/.test(raw)) return raw.slice(0, 10)

  const match = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`

  return raw.slice(0, 10)
}

const datePickerLocale = (lng: string) => (lng?.startsWith('es') ? es : enUS)

const parseDatePickerValue = (value: unknown) => {
  const raw = toInputDate(value)
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) return null
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null

  return date
}

const toDatePickerValue = (date: Date | null) => {
  if (!date || Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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

// ✅ schema dinámico: group required SOLO cuando sea editable
const schema = (t: TranslationFunction, groupEditable: boolean) =>
  yup.object().shape({
    name: yup.string().required(t('Name is required')),
    training_action: yup.mixed<List>().nullable().required(t('Training action is required')),
    course_type: yup.mixed<List>().nullable().required(t('Course type is required')),
    teacher: yup.mixed<List>().nullable().required(t('Teacher is required')),
    course_status: yup.mixed<List>().nullable().required(t('Course status is required')),

    group: groupEditable
      ? yup
          .string()
          .required(t('Group is required'))
          .test('isNumeric', t('Group must be numeric'), v => {
            if (v == null) return false

            return /^\d+$/.test(String(v).trim())
          })
      : yup.string().nullable()
  })

type FormValues = {
  name: string
  training_action: List | null
  group: string
  course_type: List | null
  teacher: List | null

  nebrija: boolean

  beginning: string
  end: string

  morning_schedule: string
  afternoon_schedule: string

  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean

  formation_center: List | null
  delivery_center: List | null

  outsourced: boolean
  course_observation: string

  reactivated: boolean

  welcome_date: string
  quarter_date: string
  half_date: string
  three_quarters_date: string
  final_date: string

  course_status: List | null
  price: number | string
}

interface CoursesGeneralTabProps {
  open: boolean
  mode: Mode
  courseId: number | null
  onLoaded?: (course: any) => void
  onClose?: () => void
}

const CoursesGeneralTab: React.FC<CoursesGeneralTabProps> = ({ open, mode, courseId, onLoaded, onClose }) => {
  const { t, i18n } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()
  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canReadTrainingActions =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.training_actions') || userPermissions.includes('read.management'))

  // ----------------------------
  // ✅ lists from redux
  const trainingActions = useSelector((s: RootState) => s.trainingAction.trainingActions) as List[]
  const courseTypes = useSelector((s: RootState) => s.courseType.courseTypes) as List[]
  const teachers = useSelector((s: RootState) => s.teacher.teachers) as List[]
  const formationCenters = useSelector((s: RootState) => s.center.centers) as List[]
  const deliveryCenters = useSelector((s: RootState) => s.center.centers) as List[]
  const courseStatuses = useSelector((s: RootState) => s.courseStatus.courseStatuses) as List[]

  // ✅ company settings (objeto key => value)
  const companySettings = useSelector((state: RootState) => state.companySetting.companySettings) as any

  const trainingActionsList = useMemo(() => (Array.isArray(trainingActions) ? trainingActions : []), [trainingActions])
  const courseTypesList = useMemo(() => (Array.isArray(courseTypes) ? courseTypes : []), [courseTypes])
  const teachersList = useMemo(() => (Array.isArray(teachers) ? teachers : []), [teachers])
  const formationCentersList = useMemo(
    () => (Array.isArray(formationCenters) ? formationCenters : []),
    [formationCenters]
  )
  const deliveryCentersList = useMemo(() => (Array.isArray(deliveryCenters) ? deliveryCenters : []), [deliveryCenters])
  const courseStatusesList = useMemo(() => (Array.isArray(courseStatuses) ? courseStatuses : []), [courseStatuses])

  // ✅ setting automatic_groups (si no existe, lo tratamos como 0)
  const isAutoGroups = useMemo(() => {
    const v = companySettings?.automatic_groups

    return String(v ?? '0') === '1'
  }, [companySettings])

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // ✅ group editable/loader
  const [groupEditable, setGroupEditable] = useState(false)
  const [groupLoading, setGroupLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      training_action: null,
      group: '',
      course_type: null,
      teacher: null,

      nebrija: false,

      beginning: '',
      end: '',

      morning_schedule: '',
      afternoon_schedule: '',

      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,

      formation_center: null,
      delivery_center: null,

      outsourced: false,
      course_observation: '',

      reactivated: false,

      welcome_date: '',
      quarter_date: '',
      half_date: '',
      three_quarters_date: '',
      final_date: '',

      course_status: null,
      price: ''
    }),
    []
  )

  // ✅ resolver dinámico según groupEditable
  const resolver = useMemo(() => yupResolver(schema(t, groupEditable)), [t, groupEditable])

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver
  })

  // ----------------------------
  // ✅ helper pick
  const pick = (list: List[], id: any) => (id != null ? list.find(x => x.id === Number(id)) ?? null : null)

  // ----------------------------
  // ✅ Evitar spam: solo pedir group cuando cambia en onChange
  const lastTrainingActionIdRef = useRef<number | null>(null)
  const groupReqRef = useRef(0)

  const fetchNextGroup = async (trainingActionId: number) => {
    // si no ha cambiado, no hagas nada
    if (lastTrainingActionIdRef.current === trainingActionId) return
    lastTrainingActionIdRef.current = trainingActionId

    const reqId = ++groupReqRef.current
    setGroupLoading(true)

    try {
      const res = await getNextFormativeAction(trainingActionId)
      if (reqId !== groupReqRef.current) return

      const payload = res.data?.data ?? res.data
      const nextGroup = payload?.group != null ? String(payload.group) : ''
      const editable = Boolean(payload?.editable)

      if (isAutoGroups) {
        setGroupEditable(false)
        setValue('group', nextGroup, { shouldDirty: false })
      } else {
        setGroupEditable(editable)
        setValue('group', editable ? '' : nextGroup, { shouldDirty: false })
      }
    } catch (error) {
      // si falla, no bloqueamos: permitimos editar
      setGroupEditable(true)

      // opcional: limpiar value
      // setValue('group', '', { shouldDirty: false })
      handleError(error, logout)
    } finally {
      if (reqId === groupReqRef.current) setGroupLoading(false)
    }
  }

  // ----------------------------
  // ✅ load course on open (edit/view) + reset en create
  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      // reset states de group
      setGroupEditable(false)
      setGroupLoading(false)
      lastTrainingActionIdRef.current = null
      groupReqRef.current = 0

      return
    }

    if (!courseId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getCourse(courseId)
        if (cancelled) return

        const c = res.data?.data?.course ?? res.data?.data ?? res.data?.course ?? null
        if (!c) throw new Error('Course payload not found')

        onLoaded?.(c)

        // En EDIT/VIEW normalmente no se edita group
        setGroupEditable(false)

        reset({
          name: c.name ?? '',
          training_action: pick(trainingActionsList, c.training_action_id),
          group: String(c.group ?? ''),
          course_type: pick(courseTypesList, c.course_type_id),
          teacher: pick(teachersList, c.teacher_id),

          nebrija: String(c.nebrija ?? '0') === '1',

          beginning: toInputDate(c.beginning),
          end: toInputDate(c.end),

          morning_schedule: c.morning_schedule ?? '',
          afternoon_schedule: c.afternoon_schedule ?? '',

          monday: String(c.monday ?? '0') === '1',
          tuesday: String(c.tuesday ?? '0') === '1',
          wednesday: String(c.wednesday ?? '0') === '1',
          thursday: String(c.thursday ?? '0') === '1',
          friday: String(c.friday ?? '0') === '1',
          saturday: String(c.saturday ?? '0') === '1',
          sunday: String(c.sunday ?? '0') === '1',

          formation_center: pick(formationCentersList, c.formation_center_id),
          delivery_center: pick(deliveryCentersList, c.delivery_center_id),

          outsourced: String(c.outsourced ?? '0') === '1',
          course_observation: c.course_observation ?? '',

          reactivated: String(c.reactivated ?? '0') === '1',

          welcome_date: toInputDate(c.welcome_date),
          quarter_date: toInputDate(c.quarter_date),
          half_date: toInputDate(c.half_date),
          three_quarters_date: toInputDate(c.three_quarters_date),
          final_date: toInputDate(c.final_date),

          course_status: pick(courseStatusesList, c.course_status_id),
          price: c.price ?? ''
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
  }, [open, mode, courseId])

  // ----------------------------
  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return

    setSaving(true)
    try {
      const formData = new FormData()

      formData.append('name', data.name ?? '')
      formData.append('training_action_id', data.training_action?.id != null ? String(data.training_action.id) : '')

      // ✅ Normalizar group manual a mínimo 4 dígitos (0001)
      let groupToSend = String(data.group ?? '')
      if (groupEditable && /^\d+$/.test(groupToSend)) {
        groupToSend = String(parseInt(groupToSend, 10)).padStart(4, '0')
      }
      formData.append('group', groupToSend)

      formData.append('course_type_id', data.course_type?.id != null ? String(data.course_type.id) : '')
      formData.append('teacher_id', data.teacher?.id != null ? String(data.teacher.id) : '')

      formData.append('nebrija', data.nebrija ? '1' : '0')

      formData.append('beginning', data.beginning ?? '')
      formData.append('end', data.end ?? '')

      formData.append('morning_schedule', data.morning_schedule ?? '')
      formData.append('afternoon_schedule', data.afternoon_schedule ?? '')

      formData.append('monday', data.monday ? '1' : '0')
      formData.append('tuesday', data.tuesday ? '1' : '0')
      formData.append('wednesday', data.wednesday ? '1' : '0')
      formData.append('thursday', data.thursday ? '1' : '0')
      formData.append('friday', data.friday ? '1' : '0')
      formData.append('saturday', data.saturday ? '1' : '0')
      formData.append('sunday', data.sunday ? '1' : '0')

      formData.append('formation_center_id', data.formation_center?.id != null ? String(data.formation_center.id) : '')
      formData.append('delivery_center_id', data.delivery_center?.id != null ? String(data.delivery_center.id) : '')

      formData.append('outsourced', data.outsourced ? '1' : '0')
      formData.append('course_observation', data.course_observation ?? '')

      formData.append('reactivated', data.reactivated ? '1' : '0')

      formData.append('welcome_date', data.welcome_date ?? '')
      formData.append('quarter_date', data.quarter_date ?? '')
      formData.append('half_date', data.half_date ?? '')
      formData.append('three_quarters_date', data.three_quarters_date ?? '')
      formData.append('final_date', data.final_date ?? '')

      formData.append('course_status_id', data.course_status?.id != null ? String(data.course_status.id) : '')
      formData.append('price', String(data.price ?? ''))

      if (mode === 'create') {
        const response = await createCourse(formData)
        if (response.data?.success) {
          toast.success(response.data.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())

          const newId = response.data?.data?.course?.id ?? response.data?.data?.id
          if (newId) {
            dispatch(courseActions.setId(newId))
            dispatch(courseActions.openModal({ mode: 'edit', courseId: newId }))
          }
        }
      } else if (mode === 'edit' && courseId) {
        const response = await editCourse(courseId, formData)
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
  const groupDisabled = disabled || groupLoading || !groupEditable

  const autoCompleteInputProps = (params: any) => ({
    ...params.inputProps,
    readOnly: disabled
  })

  const openTrainingAction = (trainingActionId?: number | null) => {
    if (!trainingActionId || !canReadTrainingActions) return

    dispatch(trainingActionActions.setId(trainingActionId))
    dispatch(trainingActionActions.openModal({ mode: 'view', trainingActionId }))
  }

  const renderDatePicker = (field: any, label: string) => (
    <DatePicker
      selected={parseDatePickerValue(field.value)}
      onChange={(date: Date | null) => field.onChange(toDatePickerValue(date))}
      onBlur={field.onBlur}
      dateFormat={['dd-MM-yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']}
      calendarStartDay={1}
      locale={datePickerLocale(i18n.language)}
      disabled={disabled}
      showMonthDropdown
      showYearDropdown
      scrollableYearDropdown
      yearDropdownItemNumber={15}
      popperClassName='mui-datepicker-popper'
      isClearable={!disabled}
      customInput={<DateInput label={t(label)} disabled={disabled} />}
    />
  )

  return (
    <DatePickerWrapper>
      <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Course data')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* name */}
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
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>

          {/* training_action */}
          <Grid item xs={12} md={4}>
            <Controller
              name='training_action'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => {
                    field.onChange(v)

                    // ✅ solo pedir group si estamos creando y el usuario selecciona algo
                    if (mode === 'create') {
                      if (v?.id) {
                        // cuando cambia, limpiamos group y pedimos el nuevo
                        setValue('group', '', { shouldDirty: false })
                        setGroupEditable(false)
                        fetchNextGroup(Number(v.id))
                      } else {
                        // limpiado
                        setValue('group', '', { shouldDirty: false })
                        setGroupEditable(false)
                        lastTrainingActionIdRef.current = null
                      }
                    }
                  }}
                  options={trainingActionsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={renderListOption}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component='span' sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                            {t('Training action')}
                          </Typography>

                          {canReadTrainingActions && field.value?.id ? (
                            <Box
                              role='button'
                              aria-label={t('View')}
                              onMouseDown={e => e.preventDefault()}
                              onClick={e => {
                                e.stopPropagation()
                                openTrainingAction(field.value?.id ?? null)
                              }}
                              sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                              <Icon icon='tabler:eye' fontSize={18} />
                            </Box>
                          ) : null}
                        </Box>
                      }
                      placeholder={t('Training action')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.training_action)}
                      helperText={(errors.training_action as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* group */}
          <Grid item xs={12} md={4}>
            <Controller
              name='group'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Group')}
                  placeholder={t('Group')}
                  {...field}
                  disabled={groupDisabled}
                  error={Boolean((errors as any).group)}
                  helperText={(errors as any).group?.message}
                />
              )}
            />
            {groupLoading && <FormHelperText>{t('Loading...')}</FormHelperText>}
          </Grid>

          {/* course_type */}
          <Grid item xs={12} md={4}>
            <Controller
              name='course_type'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={courseTypesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={renderListOption}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Course type')}
                      placeholder={t('Course type')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.course_type)}
                      helperText={(errors.course_type as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* teacher */}
          <Grid item xs={12} md={4}>
            <Controller
              name='teacher'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={teachersList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={renderListOption}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Teacher')}
                      placeholder={t('Teacher')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.teacher)}
                      helperText={(errors.teacher as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* price */}
          <Grid item xs={12} md={4}>
            <Controller
              name='price'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Price')}
                  placeholder={t('Price')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          {/* beginning / end */}
          <Grid item xs={12} md={3}>
            <Controller
              name='beginning'
              control={control}
              render={({ field }) => renderDatePicker(field, 'Beginning')}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='end'
              control={control}
              render={({ field }) => renderDatePicker(field, 'End')}
            />
          </Grid>

          {/* schedules */}
          <Grid item xs={12} md={3}>
            <Controller
              name='morning_schedule'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Morning schedule')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='afternoon_schedule'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Afternoon schedule')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          {/* day switches */}
          {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => (
            <Grid key={day} item xs={12} sm={3} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Controller
                name={day}
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label={t(day.charAt(0).toUpperCase() + day.slice(1))}
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
          ))}

          {/* centers */}
          <Grid item xs={12} md={4}>
            <Controller
              name='formation_center'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={formationCentersList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={renderListOption}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Formation center')}
                      placeholder={t('Formation center')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='delivery_center'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={deliveryCentersList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={renderListOption}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Delivery center')}
                      placeholder={t('Delivery center')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* course status */}
          <Grid item xs={12} md={4}>
            <Controller
              name='course_status'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={courseStatusesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={renderListOption}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Course status')}
                      placeholder={t('Course status')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.course_status)}
                      helperText={(errors.course_status as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* booleans */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='nebrija'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Nebrija')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='outsourced'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Outsourced')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='reactivated'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Reactivated')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>

          {/* milestone dates */}
          {(
            [
              ['welcome_date', 'Welcome date'],
              ['quarter_date', 'Quarter date'],
              ['half_date', 'Half date'],
              ['three_quarters_date', 'Three quarters date'],
              ['final_date', 'Final date']
            ] as const
          ).map(([key, label]) => (
            <Grid key={key} item xs={12} md={3}>
              <Controller
                name={key}
                control={control}
                render={({ field }) => renderDatePicker(field, label)}
              />
            </Grid>
          ))}

          {/* observation */}
          <Grid item xs={12}>
            <Controller
              name='course_observation'
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
                  disabled={disabled}
                />
              )}
            />
            {false && (
              <FormHelperText error>{String((errors as any)?.course_observation?.message ?? '')}</FormHelperText>
            )}
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

export default CoursesGeneralTab
