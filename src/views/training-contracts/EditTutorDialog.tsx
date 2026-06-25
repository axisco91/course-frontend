import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import toast from 'react-hot-toast'
import { updateTutorInfo } from 'src/api/api'

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
  console.log(element)
  const [trainingTutor, setTrainingTutor] = useState('')
  const [trainingTutorDni, setTrainingTutorDni] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTrainingTutor(String(element?.training_tutor ?? ''))
    setTrainingTutorDni(String(element?.training_tutor_dni ?? ''))
  }, [open, element])

  const save = async () => {
    if (!element?.id) return
    if (!trainingTutor.trim() || !trainingTutorDni.trim()) {
      toast.error('Tutor y DNI del tutor son obligatorios')

      return
    }

    setSaving(true)
    try {
      // ✅ aquí luego llamaremos a la API: updateTutorInfo(element.id, { training_tutor, training_tutor_dni })
      // de momento, lo dejamos preparado:
      await updateTutorInfo(element.id, { training_tutor: trainingTutor, training_tutor_dni: trainingTutorDni })

      // Simulación mínima para no romper ahora:
      // (cuando metamos API, borra estas 2 líneas)
      await new Promise(r => setTimeout(r, 0))

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
            <CustomTextField
              fullWidth
              label='Tutor'
              value={trainingTutor}
              onChange={e => setTrainingTutor(e.target.value)}
              disabled={saving}
            />
          </Grid>

          <Grid item xs={12}>
            <CustomTextField
              fullWidth
              label='DNI del Tutor'
              value={trainingTutorDni}
              onChange={e => setTrainingTutorDni(e.target.value)}
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
