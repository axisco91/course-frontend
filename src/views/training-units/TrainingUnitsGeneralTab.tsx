import { yupResolver } from '@hookform/resolvers/yup'
import { Box, Button, FormControlLabel, Grid, Switch } from '@mui/material'
import { Fragment, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, SubmitHandler, useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import { createTrainingUnit, editTrainingUnit, getTrainingUnit } from 'src/api/api'
import { AuthContext } from 'src/context/AuthContext'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { useDispatch, useSelector } from 'react-redux'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { trainingUnitActions } from 'src/reducers/general/TrainingUnitReducer'
import { RootState } from 'src/reducers/types/types'
import SavingDialog from 'src/views/components/SavingDialog'

type Mode = 'view' | 'edit' | 'create'

type FormValues = {
  formative_unit: string
  name: string
  tutoring_hours: number | null
  exam_hours: number | null
  teletraining_hours: number | null
  face_to_face_hours: number | null
  total_hours: number | null
  active: boolean
}

interface TrainingUnitsGeneralTabProps {
  open: boolean
  mode: Mode
  trainingUnitId: number | null
  onLoaded?: (trainingUnitData: any) => void
  onClose?: () => void
  onModeChange?: (mode: Mode) => void
}

const numericField = (message: string) =>
  yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
    .min(0, 'Debe ser mayor o igual a 0')
    .required(message)

const schema = yup.object().shape({
  formative_unit: yup.string().trim().required('Unidad Formativa es requerida'),
  name: yup.string().trim().required('Nombre es requerido'),
  tutoring_hours: numericField('Horas Tutorías es requerido'),
  exam_hours: numericField('Horas Examen es requerido'),
  teletraining_hours: numericField('Horas Teleformación es requerido'),
  face_to_face_hours: yup.number().nullable(),
  total_hours: yup.number().nullable(),
  active: yup.boolean().required()
})

const toArray = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (raw && typeof raw === 'object') return Object.values(raw)

  return []
}

const isTrainingUnitLike = (value: any) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  return (
    value.id !== undefined ||
    value.name !== undefined ||
    value.formative_unit !== undefined ||
    value.code !== undefined ||
    value.total_hours !== undefined
  )
}

const findTrainingUnitInUnknown = (raw: any): any => {
  if (raw == null) return null

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const found = findTrainingUnitInUnknown(item)
      if (found) return found
    }

    return null
  }

  if (typeof raw !== 'object') return null

  if (isTrainingUnitLike(raw)) return raw

  const priorityKeys = ['training_unit', 'training_units', 'unit', 'units', 'item', 'result', 'payload', 'data']
  for (const key of priorityKeys) {
    if (key in raw) {
      const found = findTrainingUnitInUnknown(raw[key])
      if (found) return found
    }
  }

  for (const value of Object.values(raw)) {
    const found = findTrainingUnitInUnknown(value)
    if (found) return found
  }

  return null
}

const extractTrainingUnitFromResponse = (data: any) => {
  const directCandidates = [
    data?.data?.training_unit,
    data?.data?.training_units,
    data?.training_unit,
    data?.training_units,
    data?.data?.data,
    data?.data,
    data
  ]

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      if (candidate.length && isTrainingUnitLike(candidate[0])) return candidate[0]
    } else if (isTrainingUnitLike(candidate)) {
      return candidate
    }
  }

  return findTrainingUnitInUnknown(data)
}

const toNumberOrNull = (value: any) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)

  return Number.isNaN(parsed) ? null : parsed
}

const toNumberOrZero = (value: any) => {
  const parsed = Number(value)

  return Number.isNaN(parsed) ? 0 : parsed
}

const toBooleanActive = (value: any) => {
  if (value === true) return true
  if (value === false) return false
  if (value === 1 || value === '1') return true
  if (value === 0 || value === '0') return false

  return true
}

const mapTrainingUnitToFormValues = (trainingUnitData: any): FormValues => {
  const tutoringHours = toNumberOrZero(trainingUnitData?.tutoring_hours)
  const examHours = toNumberOrZero(trainingUnitData?.exam_hours)
  const teletrainingHours = toNumberOrZero(trainingUnitData?.teletraining_hours)

  const computedFaceToFace = Number((tutoringHours + examHours).toFixed(2))
  const computedTotal = Number((teletrainingHours + examHours + tutoringHours).toFixed(2))

  return {
    formative_unit: String(trainingUnitData?.formative_unit ?? trainingUnitData?.code ?? ''),
    name: String(trainingUnitData?.name ?? ''),
    tutoring_hours: toNumberOrNull(trainingUnitData?.tutoring_hours) ?? 0,
    exam_hours: toNumberOrNull(trainingUnitData?.exam_hours) ?? 0,
    teletraining_hours: toNumberOrNull(trainingUnitData?.teletraining_hours) ?? 0,
    face_to_face_hours: toNumberOrNull(trainingUnitData?.face_to_face_hours) ?? computedFaceToFace,
    total_hours: toNumberOrNull(trainingUnitData?.total_hours ?? trainingUnitData?.hours) ?? computedTotal,
    active: toBooleanActive(trainingUnitData?.active ?? trainingUnitData?.is_active)
  }
}

const TrainingUnitsGeneralTab: React.FC<TrainingUnitsGeneralTabProps> = ({
  open,
  mode,
  trainingUnitId,
  onLoaded,
  onClose,
  onModeChange
}) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  const trainingUnits = useSelector((state: RootState) => state.trainingUnit.trainingUnits)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.management')

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const readOnly = mode === 'view'

  const defaultValues = useMemo<FormValues>(
    () => ({
      formative_unit: '',
      name: '',
      tutoring_hours: 0,
      exam_hours: 0,
      teletraining_hours: 0,
      face_to_face_hours: 0,
      total_hours: 0,
      active: true
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
    resolver: yupResolver(schema),
    shouldUnregister: false
  })

  const tutoringHours = Number(useWatch({ control, name: 'tutoring_hours' }) ?? 0)
  const examHours = Number(useWatch({ control, name: 'exam_hours' }) ?? 0)
  const teletrainingHours = Number(useWatch({ control, name: 'teletraining_hours' }) ?? 0)

  useEffect(() => {
    const faceToFaceHours = Number((tutoringHours + examHours).toFixed(2))
    const totalHours = Number((teletrainingHours + examHours + tutoringHours).toFixed(2))

    setValue('face_to_face_hours', faceToFaceHours, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false
    })
    setValue('total_hours', totalHours, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false
    })
  }, [tutoringHours, examHours, teletrainingHours, setValue])

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!trainingUnitId) return

    const localTrainingUnit = toArray(trainingUnits).find((item: any) => Number(item?.id) === Number(trainingUnitId))
    if (localTrainingUnit) {
      onLoaded?.(localTrainingUnit)
      dispatch(trainingUnitActions.setName(localTrainingUnit?.name ?? ''))
      reset(mapTrainingUnitToFormValues(localTrainingUnit))
    }

    let cancelled = false

    const loadTrainingUnit = async () => {
      setLoading(true)
      try {
        const res = await getTrainingUnit(trainingUnitId)
        if (cancelled) return

        const trainingUnitData = extractTrainingUnitFromResponse(res.data)
        if (!trainingUnitData) throw new Error('Training Unit payload not found')

        onLoaded?.(trainingUnitData)
        dispatch(trainingUnitActions.setName(trainingUnitData?.name ?? ''))
        reset(mapTrainingUnitToFormValues(trainingUnitData))
      } catch (error) {
        if (!cancelled) handleErrorRef.current(error, logoutRef.current)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTrainingUnit()

    return () => {
      cancelled = true
    }
  }, [open, mode, trainingUnitId, trainingUnits, defaultValues, dispatch, onLoaded, reset])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return

    setSaving(true)

    try {
      const tutoring = Number(data.tutoring_hours ?? 0)
      const exam = Number(data.exam_hours ?? 0)
      const teletraining = Number(data.teletraining_hours ?? 0)
      const faceToFace = Number((tutoring + exam).toFixed(2))
      const total = Number((teletraining + exam + tutoring).toFixed(2))

      const formData = new FormData()
      formData.append('formative_unit', data.formative_unit?.trim() ?? '')
      formData.append('code', data.formative_unit?.trim() ?? '')
      formData.append('name', data.name?.trim() ?? '')
      formData.append('tutoring_hours', String(tutoring))
      formData.append('exam_hours', String(exam))
      formData.append('teletraining_hours', String(teletraining))
      formData.append('face_to_face_hours', String(faceToFace))
      formData.append('total_hours', String(total))
      formData.append('active', data.active ? '1' : '0')

      if (mode === 'create') {
        const response = await createTrainingUnit(formData)

        if (response.data?.success) {
          toast.success(response.data?.message ?? 'Unidad formativa guardada')
          dispatch(generalActions.addFilterButtonClickCount())

          const newTrainingUnit = extractTrainingUnitFromResponse(response.data)
          if (newTrainingUnit) {
            dispatch(trainingUnitActions.setId(Number(newTrainingUnit.id ?? 0) || null))
            dispatch(trainingUnitActions.setName(String(newTrainingUnit.name ?? data.name ?? '')))
          }

          onClose?.()
        } else {
          toast.error(response.data?.message ?? 'Error al guardar la unidad formativa')
        }
      } else if (mode === 'edit' && trainingUnitId) {
        const response = await editTrainingUnit(trainingUnitId, formData)

        if (response.data?.success) {
          toast.success(response.data?.message ?? 'Unidad formativa guardada')
          dispatch(generalActions.addFilterButtonClickCount())
          dispatch(trainingUnitActions.setName(data.name?.trim() ?? ''))
          onClose?.()
        } else {
          toast.error(response.data?.message ?? 'Error al guardar la unidad formativa')
        }
      }
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Fragment>
      {readOnly && canUpdate && (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant='contained'
            onClick={() => {
              onModeChange?.('edit')
            }}
          >
            <Icon icon='tabler:pencil' fontSize={20} />
            Editar
          </Button>
        </Box>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={4}>
            <Controller
              name='formative_unit'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label='Unidad Formativa'
                  placeholder='Unidad Formativa'
                  error={Boolean(errors.formative_unit)}
                  helperText={errors.formative_unit?.message}
                  disabled={readOnly}
                  {...field}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label='Nombre'
                  placeholder='Nombre'
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  disabled={readOnly}
                  {...field}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='tutoring_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Horas Tutorías'
                  placeholder='Horas Tutorías'
                  error={Boolean(errors.tutoring_hours)}
                  helperText={errors.tutoring_hours?.message}
                  disabled={readOnly}
                  value={field.value ?? ''}
                  onChange={event => {
                    const value = event.target.value
                    field.onChange(value === '' ? null : Number(value))
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='exam_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Horas Examen'
                  placeholder='Horas Examen'
                  error={Boolean(errors.exam_hours)}
                  helperText={errors.exam_hours?.message}
                  disabled={readOnly}
                  value={field.value ?? ''}
                  onChange={event => {
                    const value = event.target.value
                    field.onChange(value === '' ? null : Number(value))
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='face_to_face_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Horas Presenciales'
                  placeholder='Horas Presenciales'
                  disabled
                  value={field.value ?? 0}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='teletraining_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Horas Teleformación'
                  placeholder='Horas Teleformación'
                  error={Boolean(errors.teletraining_hours)}
                  helperText={errors.teletraining_hours?.message}
                  disabled={readOnly}
                  value={field.value ?? ''}
                  onChange={event => {
                    const value = event.target.value
                    field.onChange(value === '' ? null : Number(value))
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='total_hours'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Horas Totales'
                  placeholder='Horas Totales'
                  disabled
                  value={field.value ?? 0}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='active'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label='Activo'
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={(_, checked) => field.onChange(checked)}
                      disabled={readOnly}
                    />
                  }
                />
              )}
            />
          </Grid>
        </Grid>

        {!readOnly && (
          <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', gap: 3 }}>
            <Button variant='contained' type='submit' disabled={saving || loading}>
              <Icon icon='tabler:device-floppy' fontSize={20} />
              Guardar
            </Button>

            <Button variant='tonal' color='secondary' onClick={onClose} disabled={saving}>
              <Icon icon='tabler:x' fontSize={20} />
              Cancelar
            </Button>
          </Box>
        )}
      </form>

      {!saving && loading && <SavingDialog labelKey='Processing Data' />}

      {saving && <SavingDialog />}
    </Fragment>
  )
}

export default TrainingUnitsGeneralTab
