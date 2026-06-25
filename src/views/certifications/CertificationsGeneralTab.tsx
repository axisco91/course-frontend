import { yupResolver } from '@hookform/resolvers/yup'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, FormControlLabel, Grid, Switch } from '@mui/material'
import { Fragment, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import { AuthContext } from 'src/context/AuthContext'
import {
  createCertification,
  editCertification,
  getCertification,
  getProfessionalAreas,
  getProfessionalFamilies
} from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { useDispatch, useSelector } from 'react-redux'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { certificationActions } from 'src/reducers/general/CertificationReducer'
import { RootState } from 'src/reducers/types/types'
import SavingDialog from 'src/views/components/SavingDialog'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string

type Option = {
  id: number
  name: string
}

type FormValues = {
  code: string
  name: string
  professional_family_id: number | null
  professional_area_id: number | null
  level: number | null
  active: boolean
}

interface CertificationsGeneralTabProps {
  open: boolean
  mode: Mode
  certificationId: number | null
  onLoaded?: (certification: any) => void
  onClose?: () => void
  onModeChange?: (mode: Mode) => void
}

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    code: yup.string().trim().required(t('Code is required')),
    name: yup.string().trim().required(t('Name is required')),
    professional_family_id: yup.number().nullable(),
    professional_area_id: yup.number().nullable(),
    level: yup.number().nullable(),
    active: yup.boolean().required()
  })

const toArray = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (raw && typeof raw === 'object') return Object.values(raw)

  return []
}

const toOptions = (raw: any): Option[] => {
  return toArray(raw)
    .map((item: any) => {
      const id = Number(item?.id ?? item?.value ?? 0)
      const name = String(item?.name ?? item?.label ?? '').trim()

      if (!id || !name) return null

      return { id, name }
    })
    .filter(Boolean) as Option[]
}

const pickFirstObject = (raw: any) => {
  if (Array.isArray(raw)) return raw[0] ?? null
  if (raw && typeof raw === 'object') return raw

  return null
}

const isCertificationLike = (value: any) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  return (
    value.id !== undefined ||
    value.code !== undefined ||
    value.name !== undefined ||
    value.professional_family_id !== undefined ||
    value.professional_area_id !== undefined
  )
}

const findCertificationInUnknown = (raw: any): any => {
  if (raw == null) return null

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const found = findCertificationInUnknown(item)
      if (found) return found
    }

    return null
  }

  if (typeof raw !== 'object') return null

  if (isCertificationLike(raw)) return raw

  const priorityKeys = ['certification', 'certifications', 'item', 'result', 'payload', 'data']
  for (const key of priorityKeys) {
    if (key in raw) {
      const found = findCertificationInUnknown(raw[key])
      if (found) return found
    }
  }

  for (const value of Object.values(raw)) {
    const found = findCertificationInUnknown(value)
    if (found) return found
  }

  return null
}

const extractCertificationFromResponse = (data: any) => {
  const directCandidates = [
    data?.data?.certification,
    data?.data?.certifications,
    data?.certification,
    data?.certifications,
    data?.data?.data,
    data?.data,
    data
  ]

  for (const candidate of directCandidates) {
    const picked = pickFirstObject(candidate)
    if (isCertificationLike(picked)) return picked
  }

  const deepFound = findCertificationInUnknown(data)
  if (deepFound) return deepFound

  return null
}

const toNumberOrNull = (value: any) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)

  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed
}

const toBooleanActive = (value: any) => {
  if (value === true) return true
  if (value === false) return false
  if (value === 1 || value === '1') return true
  if (value === 0 || value === '0') return false

  return true
}

const mapCertificationToFormValues = (certification: any): FormValues => ({
  code: String(certification?.code ?? ''),
  name: String(certification?.name ?? ''),
  professional_family_id: toNumberOrNull(
    certification?.professional_family_id ?? certification?.professional_family?.id ?? certification?.family_id
  ),
  professional_area_id: toNumberOrNull(
    certification?.professional_area_id ?? certification?.professional_area?.id ?? certification?.area_id
  ),
  level: toNumberOrNull(certification?.level ?? certification?.levels?.value ?? certification?.levels),
  active: toBooleanActive(certification?.active ?? certification?.is_active)
})

const levelOptions: Option[] = [
  { id: 1, name: '1' },
  { id: 2, name: '2' },
  { id: 3, name: '3' }
]

const CertificationsGeneralTab: React.FC<CertificationsGeneralTabProps> = ({
  open,
  mode,
  certificationId,
  onLoaded,
  onClose,
  onModeChange
}) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  const certifications = useSelector((state: RootState) => state.certification.certifications)

  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.management')

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [families, setFamilies] = useState<Option[]>([])
  const [areas, setAreas] = useState<Option[]>([])

  const readOnly = mode === 'view'

  const defaultValues = useMemo<FormValues>(
    () => ({
      code: '',
      name: '',
      professional_family_id: null,
      professional_area_id: null,
      level: null,
      active: true
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
    resolver: yupResolver(schema((k: string) => k)),
    shouldUnregister: false
  })

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const loadOptions = async () => {
      try {
        const [familiesRes, areasRes] = await Promise.all([getProfessionalFamilies(), getProfessionalAreas()])

        if (cancelled) return

        const familiesData =
          familiesRes.data?.data?.professional_families ?? familiesRes.data?.data?.data ?? familiesRes.data?.professional_families
        const areasData =
          areasRes.data?.data?.professional_areas ?? areasRes.data?.data?.data ?? areasRes.data?.professional_areas

        setFamilies(toOptions(familiesData))
        setAreas(toOptions(areasData))
      } catch (error) {
        if (!cancelled) handleErrorRef.current(error, logoutRef.current)
      }
    }

    loadOptions()

    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!certificationId) return

    const localCertification = toArray(certifications).find((item: any) => Number(item?.id) === Number(certificationId))
    if (localCertification) {
      onLoaded?.(localCertification)
      dispatch(certificationActions.setName(localCertification?.name ?? ''))
      reset(mapCertificationToFormValues(localCertification))
    }

    let cancelled = false

    const loadCertification = async () => {
      setLoading(true)

      try {
        const res = await getCertification(certificationId)
        if (cancelled) return

        const certification = extractCertificationFromResponse(res.data)

        if (!certification) throw new Error('Certification payload not found')

        onLoaded?.(certification)

        dispatch(certificationActions.setName(certification?.name ?? ''))

        reset(mapCertificationToFormValues(certification))
      } catch (error) {
        if (!cancelled) handleErrorRef.current(error, logoutRef.current)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCertification()

    return () => {
      cancelled = true
    }
  }, [open, mode, certificationId, certifications, defaultValues, dispatch, onLoaded, reset])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return

    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('code', data.code?.trim() ?? '')
      formData.append('name', data.name?.trim() ?? '')
      formData.append('level', data.level ? String(data.level) : '')
      formData.append('professional_family_id', data.professional_family_id ? String(data.professional_family_id) : '')
      formData.append('professional_area_id', data.professional_area_id ? String(data.professional_area_id) : '')
      formData.append('active', data.active ? '1' : '0')

      if (mode === 'create') {
        const response = await createCertification(formData)

        if (response.data?.success) {
          toast.success(response.data?.message ?? 'Guardado')
          dispatch(generalActions.addFilterButtonClickCount())

          const newCertification = response.data?.data?.certification ?? response.data?.data ?? null
          const newId = Number(newCertification?.id ?? 0)
          const newName = String(newCertification?.name ?? data.name ?? '')

          if (newId) {
            dispatch(certificationActions.setId(newId))
            dispatch(certificationActions.setName(newName))
            dispatch(
              certificationActions.openModal({
                mode: 'edit',
                certificationId: newId,
                certificationName: newName
              })
            )
            onModeChange?.('edit')
          }
        } else {
          toast.error(response.data?.message ?? 'Error al guardar la certificación')
        }
      } else if (mode === 'edit' && certificationId) {
        const response = await editCertification(certificationId, formData)

        if (response.data?.success) {
          toast.success(response.data?.message ?? 'Guardado')
          dispatch(generalActions.addFilterButtonClickCount())
          dispatch(certificationActions.setName(data.name?.trim() ?? ''))
        } else {
          toast.error(response.data?.message ?? 'Error al guardar la certificación')
        }
      }
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setSaving(false)
    }
  }

  const findOption = (options: Option[], value: number | null) => {
    if (value == null) return null

    return options.find(opt => Number(opt.id) === Number(value)) ?? null
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
              name='code'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label='Código'
                  placeholder='Código'
                  error={Boolean(errors.code)}
                  helperText={errors.code?.message}
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
              name='professional_family_id'
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  options={families}
                  disabled={readOnly}
                  value={findOption(families, value)}
                  onChange={(_, selected) => onChange(selected?.id ?? null)}
                  getOptionLabel={option => option?.name ?? ''}
                  isOptionEqualToValue={(option, selected) => Number(option.id) === Number(selected.id)}
                  renderInput={params => (
                    <CustomTextField {...params} fullWidth label='Familia profesional' placeholder='Selecciona...' />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='professional_area_id'
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  options={areas}
                  disabled={readOnly}
                  value={findOption(areas, value)}
                  onChange={(_, selected) => onChange(selected?.id ?? null)}
                  getOptionLabel={option => option?.name ?? ''}
                  isOptionEqualToValue={(option, selected) => Number(option.id) === Number(selected.id)}
                  renderInput={params => (
                    <CustomTextField {...params} fullWidth label='Área profesional' placeholder='Selecciona...' />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='level'
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  options={levelOptions}
                  disabled={readOnly}
                  value={findOption(levelOptions, value)}
                  onChange={(_, selected) => onChange(selected?.id ?? null)}
                  getOptionLabel={option => option?.name ?? ''}
                  isOptionEqualToValue={(option, selected) => Number(option.id) === Number(selected.id)}
                  renderInput={params => <CustomTextField {...params} fullWidth label='Nivel' placeholder='Selecciona...' />}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
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

export default CertificationsGeneralTab
