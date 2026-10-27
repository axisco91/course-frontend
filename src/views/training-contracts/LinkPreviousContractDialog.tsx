import { useEffect, useState } from 'react'
import { Alert, Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import { getTrainingContractPreviousCandidates, linkTrainingContractPrevious } from 'src/api/api'

type Candidate = { id: number; number_cfa: string; beginning: string; end: string }
type Props = { contractId: number; open: boolean; onClose: () => void; onLinked: (contract: any) => void }
const label = (contract: Candidate) => `CFA ${contract.number_cfa || contract.id} · ${contract.beginning} — ${contract.end}`
const errorMessage = (error: any) => error?.response?.data?.errors?.previous_training_contract_id?.[0]
  ?? error?.response?.data?.message ?? 'No se pudo vincular el contrato.'

export default function LinkPreviousContractDialog({ contractId, open, onClose, onLinked }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    let active = true
    setSelected(null)
    setCandidates([])
    setError('')
    setLoading(true)
    getTrainingContractPreviousCandidates(contractId)
      .then(response => { if (active) setCandidates(response.data?.data?.candidates ?? []) })
      .catch(error => { if (active) setError(errorMessage(error)) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [open, contractId])

  const link = async () => {
    if (!selected || saving) return
    setSaving(true)
    setError('')
    try {
      const response = await linkTrainingContractPrevious(contractId, selected.id)
      onLinked(response.data.data.training_contract)
      toast.success('Contrato vinculado. Ya puedes calcular el itinerario.')
      onClose()
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth='sm'>
      <DialogTitle>Vincular con contrato anterior</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 4 }}>Selecciona el contrato anterior del mismo alumno y empresa. Las fechas deben ser consecutivas. Si no está registrado, debes registrarlo primero.</Typography>
        {error && <Alert severity='error' sx={{ mb: 4 }}>{error}</Alert>}
        <Autocomplete
          options={candidates}
          value={selected}
          loading={loading}
          disabled={loading || saving}
          getOptionLabel={label}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, value) => setSelected(value)}
          noOptionsText='No hay contratos anteriores compatibles.'
          renderInput={params => <TextField {...params} label='Contrato anterior' />}
        />
        {selected && <Alert severity='info' sx={{ mt: 4 }}>Se vinculará este contrato a {label(selected)} como su siguiente prórroga. Después podrás calcular el itinerario.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={onClose}>Cancelar</Button>
        <Button variant='contained' disabled={!selected || loading || saving} onClick={link}>Confirmar vinculación</Button>
      </DialogActions>
    </Dialog>
  )
}
