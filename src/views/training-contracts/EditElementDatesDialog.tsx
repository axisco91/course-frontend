// EditElementDatesDialog.tsx
import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import toast from 'react-hot-toast'
import { trainingContractElementEditDate } from 'src/api/api'

const EditElementDatesDialog = ({
  open,
  element,
  onClose,
  onSaved
}: {
  open: boolean
  element: any | null
  onClose: () => void
  onSaved?: (updatedElement: any) => Promise<void> | void
}) => {
  const [beginning, setBeginning] = useState('')
  const [end, setEnd] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setBeginning(String(element?.beginning ?? '').slice(0, 10))
    setEnd(String(element?.end ?? '').slice(0, 10))
  }, [open, element])

  const save = async () => {
    if (!element?.id) return
    if (!beginning || !end) return toast.error('Inicio y fin son obligatorios')

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('beginning', beginning)
      formData.append('end', end)

      const res = await trainingContractElementEditDate(element.id, formData)

      if (res?.status !== 200) {
        toast.error(res?.data?.message ?? 'No se pudieron guardar las fechas')

        return
      }

      const updated = res?.data?.data?.training_contract_element

      if (!updated) {
        toast.error('Guardado OK pero el backend no devolvió el elemento actualizado')

        return
      }

      toast.success('Fechas guardadas')
      await onSaved?.(updated)
      onClose()
    } catch (e) {
      toast.error('No se pudieron guardar las fechas')
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
      <DialogTitle>Editar Fechas</DialogTitle>

      <DialogContent sx={{ pt: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              label='Inicio'
              type='date'
              InputLabelProps={{ shrink: true }}
              value={beginning}
              onChange={e => setBeginning(e.target.value)}
              disabled={saving}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              label='Fin'
              type='date'
              InputLabelProps={{ shrink: true }}
              value={end}
              onChange={e => setEnd(e.target.value)}
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

export default EditElementDatesDialog
