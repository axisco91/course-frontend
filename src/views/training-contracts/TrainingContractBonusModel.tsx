import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import toast from 'react-hot-toast'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

import { generalActions } from 'src/reducers/general/GeneralReducer'
import { trainingContractBonusActions } from 'src/reducers/trainingContracts/TrainingContractBonusReducer'

// ✅ API (ajusta nombres si son distintos en tu api.ts)
import { createTrainingContractBonus, editTrainingContractBonus } from 'src/api/api'

type Mode = 'create' | 'edit' | 'view'
type Option = { id: number; name: string }

const MONTHS: Option[] = [
  { id: 1, name: 'Enero' },
  { id: 2, name: 'Febrero' },
  { id: 3, name: 'Marzo' },
  { id: 4, name: 'Abril' },
  { id: 5, name: 'Mayo' },
  { id: 6, name: 'Junio' },
  { id: 7, name: 'Julio' },
  { id: 8, name: 'Agosto' },
  { id: 9, name: 'Septiembre' },
  { id: 10, name: 'Octubre' },
  { id: 11, name: 'Noviembre' },
  { id: 12, name: 'Diciembre' }
]

const toYmd = (v: string) => {
  // acepta "YYYY-MM-DD" o "DD/MM/YYYY"
  const s = String(v ?? '').trim()
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')

    return `${y}-${m}-${d}`
  }

  return s
}

const currentYear = new Date().getFullYear()
const YEARS: Option[] = Array.from({ length: 14 }).map((_, i) => {
  const y = currentYear + 4 - i

  return { id: y, name: String(y) }
})

const pickBonusDate = (row: any, keys: string[]) => {
  for (const key of keys) {
    const value = row?.[key]
    if (value) return String(value).slice(0, 10)
  }

  return ''
}

const TrainingContractBonusModal = ({
  open,
  trainingContractId
}: {
  open: boolean
  trainingContractId: number | null
}) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const mode = useSelector((s: RootState) => (s as any).trainingContractBonus?.modalMode) as Mode
  const id = useSelector((s: RootState) => (s as any).trainingContractBonus?.id) as number | null
  const rows = useSelector((s: RootState) => (s as any).trainingContractBonus?.trainingContractBonuses ?? []) as any[]
  const selectedBonus = useSelector(
    (s: RootState) => (s as any).trainingContractBonus?.selectedTrainingContractBonus ?? null
  ) as any | null

  const readOnly = mode === 'view'

  const selectedRow = useMemo(() => {
    if (selectedBonus) return selectedBonus
    if (!id) return null

    return rows.find((r: any) => Number(r?.id) === Number(id)) ?? null
  }, [rows, id, selectedBonus])

  // ✅ form local (para que NO se pierdan datos al clickar fuera)
  const [month, setMonth] = useState<Option | null>(null)
  const [year, setYear] = useState<Option | null>(null)
  const [start, setStart] = useState('') // YYYY-MM-DD
  const [end, setEnd] = useState('') // YYYY-MM-DD
  const [amount, setAmount] = useState<string>('') // string para input controlado
  const [invoiced, setInvoiced] = useState<boolean>(false)

  const [saving, setSaving] = useState(false)

  // ✅ cargar datos al abrir
  useEffect(() => {
    if (!open) return

    if ((mode === 'edit' || mode === 'view') && selectedRow) {
      const monthName = String(selectedRow?.month_name ?? selectedRow?.monthName ?? '').trim().toLowerCase()
      const monthByName = MONTHS.find(x => x.name.toLowerCase() === monthName) ?? null
      const m = Number(selectedRow?.month ?? selectedRow?.month_id ?? monthByName?.id ?? 0)
      const y = Number(selectedRow?.year)

      setMonth(m ? MONTHS.find(x => x.id === m) ?? null : null)
      setYear(y ? YEARS.find(x => x.id === y) ?? { id: y, name: String(y) } : null)

      setStart(pickBonusDate(selectedRow, ['start', 'beginning', 'from', 'from_date']))
      setEnd(pickBonusDate(selectedRow, ['end', 'ending', 'finish', 'to', 'to_date']))
      setAmount(String(selectedRow?.amount ?? ''))
      setInvoiced(Number(selectedRow?.invoiced ?? 0) === 1)
    } else {
      // create
      setMonth(null)
      setYear(null)
      setStart('')
      setEnd('')
      setAmount('')
      setInvoiced(false)
    }
  }, [open, mode, selectedRow])

  const close = () => {
    dispatch(trainingContractBonusActions.closeTrainingContractBonusModal())
    dispatch(trainingContractBonusActions.setId(null))
  }

  const save = async () => {
    if (readOnly) return
    if (!trainingContractId) return

    if (!month?.id) return toast.error('Mes requerido')
    if (!year?.id) return toast.error('Año requerido')
    if (!start) return toast.error('Desde requerido')
    if (!end) return toast.error('Hasta requerido')
    if (!amount || Number(amount) <= 0) return toast.error('Cantidad requerida')

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('training_contract_id', String(trainingContractId))
      formData.append('month', String(month.id))
      formData.append('year', String(year.id))
      formData.append('start', toYmd(start))
      formData.append('end', toYmd(end))
      formData.append('amount', String(amount))
      formData.append('invoiced', invoiced ? '1' : '0')

      const res =
        mode === 'edit' && id
          ? await editTrainingContractBonus(id, formData)
          : await createTrainingContractBonus(formData)

      if (res?.status === 200) {
        toast.success('Bonificación guardada')

        // ✅ refetch lo hace la tabla
        dispatch(generalActions.addFilterButtonClickCount())

        close()
      } else {
        toast.error(res?.data?.message ?? 'Error')
      }
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : close}
      data-backdrop-confirm={saving ? 'off' : undefined}
      fullWidth
      maxWidth='md'

      // ✅ clave: no cierres al click fuera si no quieres perder foco/editar
      disableEscapeKeyDown={saving}
    >
      <DialogTitle>
        {mode === 'edit' ? 'Editar Bonificación' : mode === 'view' ? 'Ver Bonificación' : 'Crear Bonificación'}
      </DialogTitle>

      <DialogContent sx={{ pt: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              value={month}
              onChange={(_, v) => setMonth(v)}
              options={MONTHS}
              getOptionLabel={(o: any) => o?.name ?? ''}
              isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
              disabled={readOnly || saving}
              renderInput={params => <CustomTextField {...params} label='Mes' placeholder='Selecciona...' />}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              value={year}
              onChange={(_, v) => setYear(v)}
              options={YEARS}
              getOptionLabel={(o: any) => o?.name ?? ''}
              isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
              disabled={readOnly || saving}
              renderInput={params => <CustomTextField {...params} label='Año' placeholder='Selecciona...' />}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <CustomTextField
              fullWidth
              label='Cantidad'
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={readOnly || saving}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              label='Desde'
              type='date'
              InputLabelProps={{ shrink: true }}
              value={start}
              onChange={e => setStart(e.target.value)}
              disabled={readOnly || saving}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              label='Hasta'
              type='date'
              InputLabelProps={{ shrink: true }}
              value={end}
              onChange={e => setEnd(e.target.value)}
              disabled={readOnly || saving}
            />
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Checkbox checked={invoiced} onChange={e => setInvoiced(e.target.checked)} disabled={readOnly || saving} />
            Facturado
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={close} disabled={saving}>
          Cancelar
        </Button>
        {!readOnly && (
          <Button variant='contained' onClick={save} disabled={saving}>
            Guardar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default TrainingContractBonusModal
