import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, MenuItem, Stack, Typography } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import toast from 'react-hot-toast'
import { getCourseMoodleModules, updateCourseMoodleModules } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'

type ModuleType = 'unit' | 'activity' | 'task' | 'final_evaluation' | 'satisfaction_survey' | 'ignore'
type MoodleModule = { cmid: number; name: string; section: string; module_type: string; type: ModuleType; automatic: boolean }

const options: { value: ModuleType; label: string }[] = [
  { value: 'unit', label: 'Unidad didáctica' },
  { value: 'activity', label: 'Actividad / autoevaluación' },
  { value: 'task', label: 'Tarea' },
  { value: 'final_evaluation', label: 'Evaluación final' },
  { value: 'satisfaction_survey', label: 'Encuesta de satisfacción' },
  { value: 'ignore', label: 'No contabilizar' }
]

const CoursesMoodleModules = ({ courseId, canUpdate }: { courseId: number; canUpdate: boolean }) => {
  const { handleError } = useErrorHandler()
  const handleErrorRef = useRef(handleError)
  handleErrorRef.current = handleError
  const [modules, setModules] = useState<MoodleModule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    getCourseMoodleModules(courseId)
      .then((response: any) => setModules(response.data?.data?.modules ?? []))
      .catch(error => handleErrorRef.current(error, null))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Stack spacing={3}>
      <Alert severity='info'>Cada actividad Moodle se contabiliza de forma independiente. Las tareas y cuestionarios también pueden marcarse como evaluación final.</Alert>
      {modules.length === 0 && <Alert severity='warning'>Moodle no ha devuelto actividades compatibles para este curso.</Alert>}
      {modules.map((module, index) => (
        <Box key={module.cmid} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 280px' }, gap: 2, alignItems: 'center' }}>
          <Box>
            <Typography fontWeight={600}>{module.name}</Typography>
            <Typography variant='caption' color='text.secondary'>{module.section} · {module.module_type.toUpperCase()} · CMID {module.cmid}</Typography>
          </Box>
          <CustomTextField
            select
            fullWidth
            label='Tipo de seguimiento'
            value={module.type}
            disabled={!canUpdate}
            onChange={event => setModules(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as ModuleType, automatic: false } : item))}
          >
            {options.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
          </CustomTextField>
        </Box>
      ))}
      {canUpdate && modules.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant='contained'
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              try {
                await updateCourseMoodleModules(courseId, modules.map(({ cmid, type }) => ({ cmid, type })))
                toast.success('Clasificación de Moodle guardada')
              } catch (error) {
                handleError(error, null)
              } finally {
                setSaving(false)
              }
            }}
          >Guardar clasificación</Button>
        </Box>
      )}
    </Stack>
  )
}

export default CoursesMoodleModules
