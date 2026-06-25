// src/views/training-contracts/tabs/ExamTutorialDialog.tsx (o donde lo tengas)
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import toast from 'react-hot-toast'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

import { examTutorialActions } from 'src/reducers/trainingContracts/ExamTutorialReducer'

// ✅ API (ajusta nombres si en tu api.ts se llaman distinto)
import { createExamTutorial, editExamTutorial, getTrainingContractActions } from 'src/api/api'

type Mode = 'create' | 'edit' | 'info' // 👈 en tu tab usas 'info'

type Option = { id: number; name: string }
type ActionOption = { id: number; label: string }

const TYPES: Option[] = [
  { id: 1, name: 'Examen' },
  { id: 2, name: 'Tutoria' }
]

const toDmy = (ymd: string) => {
  // ymd: YYYY-MM-DD -> DD-MM-YYYY
  if (!ymd) return ''
  if (/^\d{2}-\d{2}-\d{4}$/.test(ymd)) return ymd
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const [y, m, d] = ymd.split('-')

    return `${d}-${m}-${y}`
  }

  return ymd
}

const ExamTutorialDialog = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  // ✅ redux
  const open = useSelector((s: RootState) => (s as any).examTutorial?.showModal) as boolean // 👈 CAMBIA si tu flag se llama distinto
  const contractId = useSelector((s: RootState) => (s as any).trainingContract?.id) as number | null
  const mode = useSelector((s: RootState) => (s as any).examTutorial?.modalMode) as Mode
  const examTutorialId = useSelector((s: RootState) => (s as any).examTutorial?.id) as number | null
  const rows = useSelector((s: RootState) => (s as any).examTutorial?.examsTutorials ?? []) as any[]
  const centers = useSelector((s: RootState) => (s as any).center?.centers ?? []) as any[]

  const selected = useMemo(() => {
    if (!examTutorialId) return null

    return rows.find((r: any) => Number(r?.id) === Number(examTutorialId)) ?? null
  }, [rows, examTutorialId])

  const readOnly = mode === 'info'

  // ✅ opciones centros
  const centerOptions: Option[] = useMemo(
    () =>
      Array.isArray(centers)
        ? centers.map((c: any) => ({
            id: Number(c.id ?? c.value),
            name: String(c.name ?? c.label ?? '')
          }))
        : [],
    [centers]
  )

  // ✅ training actions (endpoint: getTrainingContractActions)
  const [trainingActions, setTrainingActions] = useState<ActionOption[]>([])
  const [loadingActions, setLoadingActions] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!contractId) return

    let cancelled = false
    ;(async () => {
      try {
        setLoadingActions(true)
        const res = await getTrainingContractActions(contractId)
        if (cancelled) return

        // Ajusta el path según tu API:
        const list =
          res?.data?.data?.training_contract_actions ??
          res?.data?.data?.trainingActions ??
          res?.data?.training_actions ??
          res?.data?.trainingActions ??
          []

        const mapped: ActionOption[] = Array.isArray(list)
          ? list.map((a: any) => ({
              id: Number(a.id ?? a.value),
              label: String(a.label ?? a.name ?? a.training_action_name ?? '')
            }))
          : []

        setTrainingActions(mapped)
      } catch (e) {
        handleErrorRef.current(e, logoutRef.current)
      } finally {
        setLoadingActions(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, contractId])

  // ✅ form local
  const [type, setType] = useState<Option | null>(null)
  const [center, setCenter] = useState<Option | null>(null)
  const [date, setDate] = useState('') // YYYY-MM-DD
  const [beginning, setBeginning] = useState('12:00') // HH:mm
  const [end, setEnd] = useState('12:00') // HH:mm
  const [trainingAction, setTrainingAction] = useState<ActionOption | null>(null)

  const [saving, setSaving] = useState(false)

  // ✅ cargar valores al abrir
  useEffect(() => {
    if (!open) return

    if ((mode === 'edit' || mode === 'info') && selected) {
      const t = String(selected?.type ?? '')
      setType(t ? TYPES.find(x => x.name === t) ?? { id: 0, name: t } : null)

      const cid = Number(selected?.center_id)
      setCenter(cid ? centerOptions.find(x => x.id === cid) ?? null : null)

      // date: si viene DD-MM-YYYY -> pásalo a YYYY-MM-DD
      const rawDate = String(selected?.date ?? '').trim()
      if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
        const [d, m, y] = rawDate.split('-')
        setDate(`${y}-${m}-${d}`)
      } else {
        setDate(rawDate.slice(0, 10))
      }

      setBeginning(String(selected?.beginning ?? '12:00'))
      setEnd(String(selected?.end ?? '12:00'))

      const taId = Number(selected?.training_action_id)
      setTrainingAction(taId ? { id: taId, label: String(selected?.training_action ?? '') } : null)
    } else {
      // create
      setType(null)
      setCenter(null)
      setDate('')
      setBeginning('12:00')
      setEnd('12:00')
      setTrainingAction(null)
    }
  }, [open, mode, selected, centerOptions])

  const close = () => {
    dispatch(examTutorialActions.changeModalStatus())
    dispatch(examTutorialActions.setExamTutorialId(null))
  }

  const save = async () => {
    if (readOnly) return
    if (!contractId) return toast.error('Contrato no disponible')

    if (!type?.name) return toast.error('Tipo requerido')
    if (!center?.id) return toast.error('Centro requerido')
    if (!date) return toast.error('Fecha requerida')
    if (!beginning) return toast.error('Hora inicio requerida')
    if (!end) return toast.error('Hora fin requerida')

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('training_contract_id', String(contractId))
      formData.append('type', type.name)
      formData.append('center_id', String(center.id))

      // ✅ si tu backend de examen/tutoria espera DD-MM-YYYY (como el antiguo)
      formData.append('date', toDmy(date))

      formData.append('beginning', beginning)
      formData.append('end', end)
      formData.append('training_action_id', trainingAction?.id ? String(trainingAction.id) : '')

      const res =
        mode === 'edit' && examTutorialId
          ? await editExamTutorial(examTutorialId, formData)
          : await createExamTutorial(formData)

      if (res?.status !== 200) {
        toast.error(res?.data?.message ?? 'No se pudo guardar')

        return
      }

      const saved =
        res?.data?.data?.exam_tutorial ??
        res?.data?.data?.examTutorial ??
        res?.data?.exam_tutorial ??
        res?.data?.examTutorial

      toast.success('Examen / Tutoría guardado')

      if (saved) {
        if (mode === 'edit' && examTutorialId) dispatch(examTutorialActions.replaceExamTutorial(saved))
        else dispatch(examTutorialActions.addExamTutorial(saved))
      }

      close()
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
      toast.error('No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={Boolean(open)}
      onClose={saving ? undefined : close}
      data-backdrop-confirm={saving ? 'off' : undefined}
      fullWidth
      maxWidth='lg'
    >
      <DialogTitle sx={{ textAlign: 'center', fontSize: 28, fontWeight: 700 }}>
        {mode === 'edit'
          ? 'Editar Examen / Tutoría'
          : mode === 'info'
          ? 'Ver Examen / Tutoría'
          : 'Crear Examen / Tutoría'}
      </DialogTitle>

      <DialogContent sx={{ pt: 6 }}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              value={type}
              onChange={(_, v) => setType(v)}
              options={TYPES}
              getOptionLabel={(o: any) => o?.name ?? ''}
              isOptionEqualToValue={(o: any, v: any) => o?.id === v?.id}
              disabled={readOnly || saving}
              renderInput={params => <CustomTextField {...params} label='Tipo' placeholder='Selecciona...' />}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              value={center}
              onChange={(_, v) => setCenter(v)}
              options={centerOptions}
              getOptionLabel={(o: any) => o?.name ?? ''}
              isOptionEqualToValue={(o: any, v: any) => o?.id === v?.id}
              disabled={readOnly || saving}
              renderInput={params => <CustomTextField {...params} label='Centros' placeholder='Selecciona...' />}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <CustomTextField
              fullWidth
              label='Fecha'
              type='date'
              InputLabelProps={{ shrink: true }}
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={readOnly || saving}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <CustomTextField
              fullWidth
              label='Hora inicio'
              type='time'
              InputLabelProps={{ shrink: true }}
              value={beginning}
              onChange={e => setBeginning(e.target.value)}
              disabled={readOnly || saving}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <CustomTextField
              fullWidth
              label='Hora Fin'
              type='time'
              InputLabelProps={{ shrink: true }}
              value={end}
              onChange={e => setEnd(e.target.value)}
              disabled={readOnly || saving}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              value={trainingAction}
              onChange={(_, v) => setTrainingAction(v)}
              options={trainingActions}
              getOptionLabel={(o: any) => o?.label ?? ''}
              isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
              loading={loadingActions}
              disabled={readOnly || saving}
              renderInput={params => (
                <CustomTextField {...params} label='Acción Formativa' placeholder='Selecciona...' />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 6 }}>
        <Button onClick={close} disabled={saving}>
          Cerrar
        </Button>
        {!readOnly && (
          <Button variant='contained' onClick={save} disabled={saving} sx={{ px: 6 }}>
            Guardar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ExamTutorialDialog
