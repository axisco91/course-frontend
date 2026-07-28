import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material'
import { useSelector } from 'react-redux'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import CustomTextField from 'src/@core/components/mui/text-field'
import { getMoodlePlatformCourses, register } from 'src/api/api'
import { RootState } from 'src/reducers/types/types'

type MoodleMode = 'disabled' | 'manual' | 'automatic'
type Teacher = { id: number; name: string; surname?: string; dni?: string }
type Platform = { id: number; name: string }
type MoodleCourse = { id: number; fullname: string; shortname: string }

type Props = {
  open: boolean
  element: any | null
  onClose: () => void
  onCreated: (element: any, queueError?: string | null) => void
}

const modes: Array<{ id: MoodleMode; name: string }> = [
  { id: 'disabled', name: 'Sin Moodle' },
  { id: 'manual', name: 'Vincular curso existente' },
  { id: 'automatic', name: 'Crear desde curso base' }
]

const normalizeDni = (value: unknown) => String(value ?? '').replace(/[\s-]/g, '').toUpperCase()
const teacherLabel = (teacher: Teacher | null) =>
  [teacher?.name, teacher?.surname].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
const apiErrorMessage = (error: any) =>
  error?.response?.data?.message ?? error?.message ?? 'No se ha podido crear el curso.'

const CreateCourseDialog = ({ open, element, onClose, onCreated }: Props) => {
  const teachers = useSelector((state: RootState) => state.teacher.teachers) as Teacher[]
  const platforms = useSelector((state: RootState) => state.webPlatform.webPlatforms) as Platform[]
  const teacherOptions = useMemo(() => (Array.isArray(teachers) ? teachers : []), [teachers])
  const platformOptions = useMemo(() => (Array.isArray(platforms) ? platforms : []), [platforms])

  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [mode, setMode] = useState<MoodleMode>('disabled')
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [moodleCourse, setMoodleCourse] = useState<MoodleCourse | null>(null)
  const [moodleCourses, setMoodleCourses] = useState<MoodleCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const tutorDni = normalizeDni(element?.training_tutor_dni)
    setTeacher(tutorDni ? teacherOptions.find(item => normalizeDni(item.dni) === tutorDni) ?? null : null)
    setMode('disabled')
    setPlatform(null)
    setMoodleCourse(null)
    setMoodleCourses([])
    setLoadingCourses(false)
    setSaving(false)
    setError('')
  }, [open, element, teacherOptions])

  useEffect(() => {
    if (!open || mode === 'disabled' || !platform?.id) {
      setMoodleCourses([])
      setMoodleCourse(null)

      return
    }

    let cancelled = false
    setLoadingCourses(true)
    setError('')
    setMoodleCourse(null)
    getMoodlePlatformCourses(platform.id)
      .then(response => {
        if (!cancelled) setMoodleCourses(response.data?.data?.courses ?? [])
      })
      .catch(fetchError => {
        if (!cancelled) {
          setMoodleCourses([])
          setError(apiErrorMessage(fetchError))
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCourses(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, mode, platform?.id])

  const handleModeChange = (nextMode: MoodleMode) => {
    setMode(nextMode)
    setPlatform(null)
    setMoodleCourse(null)
    setMoodleCourses([])
    setError('')
  }

  const submit = async () => {
    if (!element?.id || !teacher?.id) {
      setError('Selecciona un profesor.')

      return
    }
    if (mode !== 'disabled' && (!platform?.id || !moodleCourse?.id)) {
      setError('Selecciona la plataforma y el curso Moodle.')

      return
    }

    setSaving(true)
    setError('')
    try {
      const payload: Record<string, string | number> = { teacher_id: teacher.id, moodle_mode: mode }
      if (mode !== 'disabled' && platform && moodleCourse) {
        payload.web_platform_id = platform.id
        if (mode === 'manual') payload.moodle_course_id = moodleCourse.id
        if (mode === 'automatic') payload.moodle_source_course_id = moodleCourse.id
      }

      const response = await register(element.id, payload)
      const data = response.data?.data ?? response.data ?? {}
      if (!data.element) throw new Error('La respuesta no contiene el elemento actualizado.')
      onCreated(data.element, data.moodle_queue_error)
      onClose()
    } catch (submitError) {
      setError(apiErrorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  const courseLabel = element?.training_action_name ?? element?.certification_name ?? 'Formación'

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Crear curso</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 2 }}>
          <Box>
            <Typography fontWeight={600}>{courseLabel}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {element?.beginning ?? '-'} — {element?.end ?? '-'}
            </Typography>
          </Box>

          {error ? <Alert severity='error'>{error}</Alert> : null}

          <Autocomplete
            value={teacher}
            options={teacherOptions}
            getOptionLabel={teacherLabel}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, value) => {
              setTeacher(value)
              setError('')
            }}
            disabled={saving}
            renderInput={params => <CustomTextField {...params} label='Profesor' required />}
          />

          <Autocomplete
            value={modes.find(item => item.id === mode) ?? modes[0]}
            options={modes}
            getOptionLabel={option => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, value) => handleModeChange(value?.id ?? 'disabled')}
            disabled={saving}
            renderInput={params => <CustomTextField {...params} label='Integración Moodle' />}
          />

          {mode !== 'disabled' ? (
            <Autocomplete
              value={platform}
              options={platformOptions}
              getOptionLabel={option => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => {
                setPlatform(value)
                setMoodleCourse(null)
                setError('')
              }}
              disabled={saving}
              renderInput={params => <CustomTextField {...params} label='Plataforma Moodle' required />}
            />
          ) : null}

          {mode !== 'disabled' ? (
            <Autocomplete
              value={moodleCourse}
              options={moodleCourses}
              loading={loadingCourses}
              getOptionLabel={option => `${option.shortname} - ${option.fullname}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => {
                setMoodleCourse(value)
                setError('')
              }}
              disabled={saving || loadingCourses || !platform}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label={mode === 'automatic' ? 'Curso base Moodle' : 'Curso Moodle existente'}
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCourses ? <CircularProgress color='inherit' size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant='contained' onClick={submit} disabled={saving || loadingCourses}>
          {saving ? <CircularProgress size={20} color='inherit' /> : 'Crear curso'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateCourseDialog
