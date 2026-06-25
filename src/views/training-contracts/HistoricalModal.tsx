// src/views/trainingContracts/tabs/HistoricalModal.tsx
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import toast from 'react-hot-toast'

import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import {
  createTrainingContractIncidence,
  editTrainingContractIncidence,

  // ✅ si lo tienes, úsalo:
  // getTrainingContractIncidence,
  // ✅ fallback si NO tienes show:
  getTrainingContractIncidence
} from 'src/api/api'

import { trainingContractIncidenceActions } from 'src/reducers/trainingContracts/TrainingContractIncidenceReducer'

type Mode = 'create' | 'edit' | 'view'
type Option = { id: number; name: string }

// helpers
const pickById = (list: Option[], id: any) => {
  const n = Number(id)
  if (!Number.isFinite(n)) return null

  return list.find(x => Number(x.id) === n) ?? null
}

type FormValues = {
  affair: string
  notes: string
  incidence_type: Option | null
  user: Option | null
}

const defaultValues: FormValues = {
  affair: '',
  notes: '',
  incidence_type: null,
  user: null
}

const HistoricalModal = ({
  open,
  mode,
  trainingContractId,
  onSaved
}: {
  open: boolean
  mode: Mode
  trainingContractId: number | null
  onSaved?: () => void
}) => {
  const dispatch = useDispatch()
  const readOnly = mode === 'view'

  const incidenceId = useSelector((s: RootState) => (s as any).trainingContractIncidence?.id) as number | null

  // listas
  const users = useSelector((s: RootState) => (s as any).user?.users ?? []) as Option[]
  const incidenceTypes = useSelector((s: RootState) => (s as any).incidenceType?.incidenceTypes ?? []) as Option[]

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues,
    mode: 'onChange',
    shouldUnregister: false // ✅ importante: evita perder valores al re-render
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const close = () => dispatch(trainingContractIncidenceActions.closeTrainingContractIncidenceModal())

  const title = useMemo(() => {
    if (mode === 'edit') return 'Editar incidencia'
    if (mode === 'view') return 'Ver incidencia'

    return 'Añadir incidencia'
  }, [mode])

  // ✅ CARGA como tu ejemplo: load() + cancelled + reset(...)
  useEffect(() => {
    if (!open) return

    let cancelled = false

    const load = async () => {
      // CREATE => limpio
      if (mode === 'create') {
        reset({ ...defaultValues })

        return
      }

      // EDIT/VIEW => necesito ids
      if (!trainingContractId || !incidenceId) return

      setLoading(true)
      try {
        // ===============================
        // ✅ Opción A: endpoint show (ideal)
        // const res = await getTrainingContractIncidence(incidenceId)
        // const sc =
        //   res?.data?.data?.incidence ??
        //   res?.data?.data?.training_contract_incidence ??
        //   res?.data?.data ??
        //   res?.data ??
        //   null
        // ===============================

        // ===============================
        // ✅ Opción B: fallback (listado + buscar id)
        const res = await getTrainingContractIncidence(incidenceId)
        const list =
          res?.data?.data?.training_contract_incidence ??
          res?.data?.training_contract_incidences ??
          res?.data?.data?.incidences ??
          res?.data?.incidences ??
          res?.data?.data ??
          res?.data ??
          []
        const sc = (Array.isArray(list) ? list : []).find((x: any) => Number(x?.id) === Number(incidenceId)) ?? null

        // ===============================

        if (cancelled) return
        if (!sc) {
          toast.error('No se encontró la incidencia (puede que se haya eliminado)')
          close()

          return
        }

        reset({
          affair: String(sc.affair ?? ''),
          notes: String(sc.notes ?? ''),
          incidence_type: sc.incidence_type_id != null ? pickById(incidenceTypes, sc.incidence_type_id) : null,
          user: sc.user_id != null ? pickById(users, sc.user_id) : null
        })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        if (!cancelled) toast.error('Error cargando la incidencia')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [open, mode, trainingContractId, incidenceId, users, incidenceTypes, reset, dispatch])

  const onSubmit = async (values: FormValues) => {
    if (readOnly) return
    if (!trainingContractId) return

    if (!values.affair?.trim()) return toast.error('Asunto requerido')
    if (!values.incidence_type?.id) return toast.error('Tipo requerido')
    if (!values.user?.id) return toast.error('Usuario requerido')

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('training_contract_id', String(trainingContractId))
      formData.append('affair', values.affair.trim())
      formData.append('notes', values.notes ?? '')
      formData.append('incidence_type_id', String(values.incidence_type.id))
      formData.append('user_id', String(values.user.id))

      const res =
        mode === 'edit' && incidenceId
          ? await editTrainingContractIncidence(incidenceId, formData)
          : await createTrainingContractIncidence(formData)

      if (res?.status === 200) {
        toast.success('Histórico guardado')
        close()
        onSaved?.()
      } else {
        toast.error(res?.data?.message ?? 'Error')
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      toast.error('Error')
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
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Grid container spacing={4} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Controller
              name='affair'
              control={control}
              render={({ field }) => (
                <CustomTextField {...field} fullWidth label='Asunto' disabled={readOnly || saving || loading} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='incidence_type'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={incidenceTypes}
                  getOptionLabel={(o: any) => o?.name ?? ''}
                  isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
                  disabled={readOnly || saving || loading}
                  renderInput={params => <CustomTextField {...params} label='Tipo' />}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='user'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={users}
                  getOptionLabel={(o: any) => o?.name ?? ''}
                  isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
                  disabled={readOnly || saving || loading}
                  renderInput={params => <CustomTextField {...params} label='Usuario' />}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name='notes'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  multiline
                  minRows={4}
                  label='Observación'
                  disabled={readOnly || saving || loading}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={close} disabled={saving}>
          Cancelar
        </Button>
        {!readOnly && (
          <Button variant='contained' onClick={handleSubmit(onSubmit)} disabled={saving || loading}>
            Guardar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default HistoricalModal
