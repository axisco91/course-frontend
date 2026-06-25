import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, FormControlLabel, Grid, Switch, Typography } from '@mui/material'
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

// ✅ TRAINING ACTION APIs (ajusta a tus exports reales)
import {
  createTrainingAction,
  editTrainingAction,
  getTrainingAction,
  getTrainingActionFormativeAction
} from 'src/api/api'

// ✅ reducer (ajusta path/nombre)
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string }
type TutorOption = { id?: number; name: string; dni?: string }

const toList = (arr: any[]): List[] =>
  Array.isArray(arr)
    ? arr
        .map(x => ({
          id: Number(x?.id ?? x?.value),
          name: String(x?.name ?? x?.label ?? '')
        }))
        .filter(x => Number.isFinite(x.id))
    : []

// ✅ Schema dinámico: formative_action required SOLO si automatic_formative != 1
const schema = (t: TranslationFunction, isAutoFormative: boolean) =>
  yup.object().shape({
    formative_action: isAutoFormative
      ? yup.string().nullable()
      : yup
          .string()
          .required(t('Formative action is required'))
          .test('isNumeric', t('Formative action must be numeric'), v => {
            if (v == null) return false
            const s = String(v).trim()

            return /^\d+$/.test(s)
          }),
    code: yup.string().nullable(),
    name: yup.string().required(t('Name is required')),

    action_type: yup.mixed<List>().nullable().required(t('Action type is required')),
    professional_area: yup.mixed<List>().nullable().required(t('Professional area is required')),
    professional_family: yup.mixed<List>().nullable().required(t('Professional family is required')),
    group: yup.mixed<List>().nullable().notRequired(),
    level: yup.mixed<List>().nullable().required(t('Level is required')),
    modality: yup.mixed<List>().nullable().required(t('Modality is required')),

    total_hours: yup
      .mixed()
      .test('isNumber', t('Total hours must be a number'), v => v === '' || v === null || !Number.isNaN(Number(v))),

    price: yup
      .number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
      .typeError(t('Price must be a number'))
      .min(0, t('Price must be >= 0'))
      .required(t('Price is required'))
  })

type FormValues = {
  formative_action: string
  code: string
  name: string

  action_type: List | null
  professional_area: List | null
  professional_family: List | null
  group: List | null
  level: List | null
  modality: List | null

  face_to_face_hours: number | string
  teletraining_hours: number | string
  total_hours: number | string
  price: number | string

  course_origin: List | null
  tutoring: List | null
  provider: List | null
  training_tutor: TutorOption | string | null
  training_tutor_dni: string

  web_platform: List | null
  user: string
  password: string

  number_units: number | string
  number_activities: number | string

  in_catalog: boolean
  specialty: boolean
  active: boolean

  objectives: string
  content: string
  observations: string
}

interface TrainingActionsGeneralTabProps {
  open: boolean
  mode: Mode
  trainingActionId: number | null
  onLoaded?: (ta: any) => void
  onClose?: () => void
}

const TrainingActionsGeneralTab: React.FC<TrainingActionsGeneralTabProps> = ({
  open,
  mode,
  trainingActionId,
  onLoaded,
  onClose
}) => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  // ✅ Lists desde redux (ajusta paths a tu store)
  const actionTypes = useSelector((s: RootState) => s.actionType?.actionTypes) as List[]
  const professionalAreas = useSelector((s: RootState) => s.professionalArea?.professionalAreas) as List[]
  const professionalFamilies = useSelector((s: RootState) => s.professionalFamily?.professionalFamilies) as List[]
  const groups = useSelector((s: RootState) => s.trainingActionGroup?.trainingActionGroups) as List[]
  const levels = useSelector((s: RootState) => s.trainingActionLevel?.trainingActionLevels) as List[]
  const modalities = useSelector((s: RootState) => s.modality?.modalities) as List[]
  const tutorings = useSelector((s: RootState) => s.tutoring?.tutorings) as List[]
  const providers = useSelector((s: RootState) => s.provider?.providers) as List[]
  const webPlatforms = useSelector((s: RootState) => s.webPlatform?.webPlatforms) as List[]
  const courseOrigins = useSelector((s: RootState) => s.courseOrigin?.courseOrigins) as List[]
  const teachers = useSelector((s: RootState) => s.teacher?.teachers) as any[]

  // ✅ company settings (objeto key => value)
  const companySettings = useSelector((state: RootState) => state.companySetting.companySettings) as any

  const actionTypesList = useMemo(() => toList(actionTypes as any[]), [actionTypes])
  const professionalAreasList = useMemo(
    () => toList(professionalAreas as any[]),
    [professionalAreas]
  )
  const professionalFamiliesList = useMemo(
    () => toList(professionalFamilies as any[]),
    [professionalFamilies]
  )
  const groupsList = useMemo(() => toList(groups as any[]), [groups])
  const levelsList = useMemo(() => toList(levels as any[]), [levels])
  const modalitiesList = useMemo(() => toList(modalities as any[]), [modalities])
  const tutoringsList = useMemo(() => toList(tutorings as any[]), [tutorings])
  const providersList = useMemo(() => toList(providers as any[]), [providers])
  const webPlatformsList = useMemo(() => toList(webPlatforms as any[]), [webPlatforms])
  const courseOriginsList = useMemo(() => toList(courseOrigins as any[]), [courseOrigins])
  const teachersList = useMemo<TutorOption[]>(
    () =>
      Array.isArray(teachers)
        ? teachers
            .map(teacher => ({
              id: Number(teacher?.id ?? teacher?.value),
              name: `${String(teacher?.name ?? '')} ${String(teacher?.surname ?? '')}`.replace(/\s+/g, ' ').trim(),
              dni: String(teacher?.dni ?? '')
            }))
            .filter(teacher => teacher.name.length > 0)
        : [],
    [teachers]
  )

  // ✅ setting automatic_formative (si no existe, lo tratamos como 0)
  const isAutoFormative = useMemo(() => {
    const v = companySettings?.automatic_formative
    console.log(v)

    return String(v ?? '0') === '1'
  }, [companySettings])

  console.log(companySettings)

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      formative_action: '',
      code: '',
      name: '',

      action_type: null,
      professional_area: null,
      professional_family: null,
      group: null,
      level: null,
      modality: null,

      face_to_face_hours: '',
      teletraining_hours: '',
      total_hours: '',
      price: '',

      course_origin: null,
      tutoring: null,
      provider: null,
      training_tutor: null,
      training_tutor_dni: '',

      web_platform: null,
      user: '',
      password: '',

      number_units: '',
      number_activities: '',

      in_catalog: false,
      specialty: false,
      active: true,

      objectives: '',
      content: '',
      observations: ''
    }),
    []
  )

  // ✅ Resolver dinámico según isAutoFormative
  const resolver = useMemo(() => yupResolver(schema(t, isAutoFormative)), [t, isAutoFormative])

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver
  })

  const disabled = readOnly || loading || saving
  const disabledFormativeAction = disabled || isAutoFormative // ✅ si es auto, siempre disabled

  const autoCompleteInputProps = (params: any) => ({ ...params.inputProps, readOnly: disabled })
  const pick = (list: List[], id: any) => (id != null ? list.find(x => x.id === Number(id)) ?? null : null)
  const getTutorLabel = (option: TutorOption | string | null | undefined) =>
    typeof option === 'string' ? option : option?.name ?? ''

  // ✅ total_hours = face_to_face + teletraining (siempre)
  const f2f = watch('face_to_face_hours')
  const tele = watch('teletraining_hours')
  const selectedTutor = watch('training_tutor')

  useEffect(() => {
    if (typeof selectedTutor === 'string') {
      setValue('training_tutor_dni', '', { shouldDirty: false })

      return
    }

    setValue('training_tutor_dni', selectedTutor?.dni ?? '', { shouldDirty: false })
  }, [selectedTutor, setValue])

  useEffect(() => {
    if (!open) return
    if (readOnly) return

    const a = Number(f2f || 0)
    const b = Number(tele || 0)
    if (Number.isNaN(a) || Number.isNaN(b)) return

    setValue('total_hours', String(a + b), { shouldDirty: false })
  }, [open, readOnly, f2f, tele, setValue])

  // ✅ load training action on open
  useEffect(() => {
    if (!open) return

    // ✅ CREATE: reset + si auto => pedir formative_action autogenerado
    if (mode === 'create') {
      reset(defaultValues)
      setLoading(true)

      let cancelled = false

      ;(async () => {
        try {
          if (isAutoFormative) {
            const res = await getTrainingActionFormativeAction()
            if (cancelled) return

            const nextFA = res.data?.data?.formative_action ?? res.data?.formative_action ?? res.data?.data ?? ''
            setValue('formative_action', String(nextFA ?? ''), { shouldDirty: false })
          } else {
            // manual: que lo escriba el usuario
            setValue('formative_action', '', { shouldDirty: false })
          }
        } catch (error) {
          if (!cancelled) handleError(error, logout)
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()

      return () => {
        cancelled = true
      }
    }

    // ✅ EDIT / VIEW
    if (!trainingActionId) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await getTrainingAction(trainingActionId)
        if (cancelled) return

        const ta = res.data?.data?.training_action ?? res.data?.data ?? res.data?.training_action ?? null
        if (!ta) throw new Error('Training action payload not found')

        onLoaded?.(ta)

        reset({
          formative_action: String(ta.formative_action ?? ''),
          code: String(ta.code ?? ''),
          name: String(ta.name ?? ''),

          action_type: pick(actionTypesList, ta.action_type_id),
          professional_area: pick(professionalAreasList, ta.professional_area_id),
          professional_family: pick(professionalFamiliesList, ta.professional_family_id),
          group: pick(groupsList, ta.training_action_group_id),
          level: pick(levelsList, ta.training_action_level_id),
          modality: pick(modalitiesList, ta.modality_id),

          face_to_face_hours: ta.face_to_face_hours ?? '',
          teletraining_hours: ta.teletraining_hours ?? '',
          total_hours: ta.total_hours ?? '',
          price: ta.price ?? '',

          course_origin: pick(courseOriginsList, ta.course_origin_id),
          tutoring: pick(tutoringsList, ta.tutoring_id),
          provider: pick(providersList, ta.provider_id),
          training_tutor: ta.training_tutor
            ? {
                name: String(ta.training_tutor ?? ''),
                dni: String(ta.training_tutor_dni ?? '')
              }
            : null,
          training_tutor_dni: String(ta.training_tutor_dni ?? ''),

          web_platform: pick(webPlatformsList, ta.web_platform_id),
          user: String(ta.user ?? ''),
          password: String(ta.password ?? ''),

          number_units: ta.number_units ?? '',
          number_activities: ta.number_activities ?? '',

          in_catalog: String(ta.in_catalog ?? '0') === '1' || ta.in_catalog === true,
          specialty: String(ta.specialty ?? '0') === '1' || ta.specialty === true,
          active: String(ta.active ?? '1') === '1' || ta.active === true,

          objectives: String(ta.objectives ?? ''),
          content: String(ta.content ?? ''),
          observations: String(ta.observations ?? '')
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
  }, [open, mode, trainingActionId, isAutoFormative])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    setSaving(true)

    try {
      const formData = new FormData()

      // --- Información General
      // formative_action: si isAutoFormative, igual se envía (viene ya puesto); si manual, lo escribe usuario
      formData.append('formative_action', data.formative_action ?? '')
      formData.append('code', data.code ?? '')
      formData.append('name', data.name ?? '')

      formData.append('action_type_id', data.action_type?.id != null ? String(data.action_type.id) : '')
      formData.append(
        'professional_area_id',
        data.professional_area?.id != null ? String(data.professional_area.id) : ''
      )
      formData.append(
        'professional_family_id',
        data.professional_family?.id != null ? String(data.professional_family.id) : ''
      )
      formData.append('training_action_group_id', data.group?.id != null ? String(data.group.id) : '')
      formData.append('training_action_level_id', data.level?.id != null ? String(data.level.id) : '')
      formData.append('modality_id', data.modality?.id != null ? String(data.modality.id) : '')

      formData.append('face_to_face_hours', String(data.face_to_face_hours ?? ''))
      formData.append('teletraining_hours', String(data.teletraining_hours ?? ''))
      formData.append('total_hours', String(data.total_hours ?? '')) // calculado
      formData.append('price', String(data.price ?? ''))

      // --- Datos Acción Formativa
      formData.append('course_origin_id', data.course_origin?.id != null ? String(data.course_origin.id) : '')
      formData.append('tutoring_id', data.tutoring?.id != null ? String(data.tutoring.id) : '')
      formData.append('provider_id', data.provider?.id != null ? String(data.provider.id) : '')
      formData.append('training_tutor', getTutorLabel(data.training_tutor))
      formData.append(
        'training_tutor_dni',
        data.training_tutor_dni ?? (typeof data.training_tutor === 'string' ? '' : data.training_tutor?.dni ?? '')
      )

      formData.append('web_platform_id', data.web_platform?.id != null ? String(data.web_platform.id) : '')
      formData.append('user', data.user ?? '')
      formData.append('password', data.password ?? '')
      formData.append('number_units', String(data.number_units ?? ''))
      formData.append('number_activities', String(data.number_activities ?? ''))

      // flags
      formData.append('in_catalog', data.in_catalog ? '1' : '0')
      formData.append('specialty', data.specialty ? '1' : '0')
      formData.append('active', data.active ? '1' : '0')

      // textos
      formData.append('objectives', data.objectives ?? '')
      formData.append('content', data.content ?? '')
      formData.append('observations', data.observations ?? '')

      if (mode === 'create') {
        const response = await createTrainingAction(formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())

          const newId = response.data?.data?.training_action?.id ?? response.data?.data?.id
          if (newId) {
            dispatch(trainingActionActions.setId(Number(newId)))
            dispatch(trainingActionActions.openModal({ mode: 'edit', trainingActionId: Number(newId) }))
          }
        }
      } else if (mode === 'edit' && trainingActionId) {
        const response = await editTrainingAction(trainingActionId, formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
        }
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
        {/* =========================== */}
        {/* INFORMACIÓN GENERAL */}
        {/* =========================== */}
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('General information')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* Row 1 */}
          <Grid item xs={12} md={3}>
            <Controller
              name='formative_action'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Formative action')}
                  {...field}
                  disabled={disabledFormativeAction} // ✅ AUTO => disabled, MANUAL => editable (si no está readOnly/loading)
                  error={Boolean((errors as any).formative_action)}
                  helperText={(errors as any).formative_action?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='code'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Code')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Name')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='action_type'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={actionTypesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Action type')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.action_type)}
                      helperText={(errors.action_type as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Row 2 */}
          <Grid item xs={12} md={3}>
            <Controller
              name='professional_area'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={professionalAreasList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Professional area')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.professional_area)}
                      helperText={(errors.professional_area as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='professional_family'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={professionalFamiliesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Professional family')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.professional_family)}
                      helperText={(errors.professional_family as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='group'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={groupsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Groups')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.group)}
                      helperText={(errors.group as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Row 3 */}
          <Grid item xs={12} md={3}>
            <Controller
              name='level'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={levelsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Level')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.level)}
                      helperText={(errors.level as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='modality'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={modalitiesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Modality')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.modality)}
                      helperText={(errors.modality as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='face_to_face_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Face-to-face hours')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='teletraining_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Teletraining hours')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='total_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Total hours')} {...field} disabled />
              )}
            />
          </Grid>

          {/* Row 4: Precio */}
          <Grid item xs={12} md={3}>
            <Controller
              name='price'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Price')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.price)}
                  helperText={(errors.price as any)?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* ============================== */}
        {/* DATOS DE LA ACCIÓN FORMATIVA */}
        {/* ============================== */}
        <Box sx={{ mb: 6, mt: 10 }}>
          <Typography variant='h6'>{t('Training action data')}</Typography>
        </Box>

        <Grid container spacing={5}>
          <Grid item xs={12} md={3}>
            <Controller
              name='course_origin'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={courseOriginsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Course origin')}
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
              name='tutoring'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={tutoringsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Tutoring')}
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
              name='training_tutor'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  freeSolo
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  onInputChange={(_, value, reason) => {
                    if (reason === 'input') field.onChange(value)
                    if (reason === 'clear') field.onChange(null)
                  }}
                  options={teachersList}
                  getOptionLabel={option => getTutorLabel(option)}
                  isOptionEqualToValue={(option, value) =>
                    typeof value !== 'string' && Number(option?.id) === Number(value?.id) && option?.name === value?.name
                  }
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Tutor')}
                      placeholder={t('Select or type the tutor name...')}
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
              name='training_tutor_dni'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Tutor DNI')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='web_platform'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={webPlatformsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Platform')}
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
              name='provider'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={providersList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Provider')}
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
              name='user'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('User')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='password'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Password')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='number_units'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Number units')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='number_activities'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label={t('Number activities')}
                  {...field}
                  disabled={disabled}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='in_catalog'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('In catalog')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
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
                  label={t('SEPE specialty')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='active'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Active')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 4, mt: 10 }}>
          <Typography variant='h6'>{t('Objectives')}</Typography>
        </Box>
        <Controller
          name='objectives'
          control={control}
          render={({ field }) => (
            <CustomTextField fullWidth multiline minRows={4} maxRows={10} {...field} disabled={disabled} />
          )}
        />

        <Box sx={{ mb: 4, mt: 8 }}>
          <Typography variant='h6'>{t('Content')}</Typography>
        </Box>
        <Controller
          name='content'
          control={control}
          render={({ field }) => (
            <CustomTextField fullWidth multiline minRows={4} maxRows={10} {...field} disabled={disabled} />
          )}
        />

        <Box sx={{ mb: 4, mt: 8 }}>
          <Typography variant='h6'>{t('Observations')}</Typography>
        </Box>
        <Controller
          name='observations'
          control={control}
          render={({ field }) => (
            <CustomTextField fullWidth multiline minRows={4} maxRows={10} {...field} disabled={disabled} />
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
  )
}

export default TrainingActionsGeneralTab
