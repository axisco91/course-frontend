import React, { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import CustomTextField from 'src/@core/components/mui/text-field'
import { updateTutorInfo } from 'src/api/api'
import { RootState } from 'src/reducers/types/types'

type Teacher = {
  id: number
  name: string
  surname?: string
  dni?: string
}

const teacherLabel = (teacher: Teacher | null) =>
  [teacher?.name, teacher?.surname].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

const normalize = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase()

const EditTutorDialog = ({
  open,
  element,
  onClose,
  onSaved
}: {
  open: boolean
  element: any | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}) => {
  const teachers = useSelector((state: RootState) => state.teacher.teachers) as Teacher[]
  const teacherOptions = useMemo(() => (Array.isArray(teachers) ? teachers : []), [teachers])
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    const tutorDni = normalize(element?.training_tutor_dni)
    const tutorName = normalize(element?.training_tutor)
    const teacher = teacherOptions.find(option => {
      if (tutorDni && normalize(option.dni) === tutorDni) return true

      return tutorName && normalize(teacherLabel(option)) === tutorName
    })

    setSelectedTeacher(teacher ?? null)
  }, [open, element, teacherOptions])

  const save = async () => {
    if (!element?.id) return
    if (!selectedTeacher || !String(selectedTeacher.dni ?? '').trim()) {
      toast.error('Tutor y DNI del tutor son obligatorios')

      return
    }

    setSaving(true)
    try {
      await updateTutorInfo(element.id, {
        training_tutor: teacherLabel(selectedTeacher),
        training_tutor_dni: String(selectedTeacher.dni)
      })

      toast.success('Tutor guardado')
      await onSaved?.()
      onClose()
    } catch (e) {
      toast.error('No se pudo guardar el tutor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      data-backdrop-confirm={saving ? 'off' : undefined}
      fullWidth
      maxWidth='sm'
    >
      <DialogTitle>Editar Tutor</DialogTitle>

      <DialogContent sx={{ pt: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Autocomplete
              value={selectedTeacher}
              onChange={(_, value) => setSelectedTeacher(value)}
              options={teacherOptions}
              getOptionLabel={teacherLabel}
              isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
              disabled={saving}
              renderInput={params => <CustomTextField {...params} label='Nombre y apellidos' />}
            />
          </Grid>

          <Grid item xs={12}>
            <CustomTextField
              fullWidth
              label='DNI del Tutor'
              value={selectedTeacher?.dni ?? ''}
              inputProps={{ readOnly: true }}
              disabled={saving}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={save} disabled={saving}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditTutorDialog
