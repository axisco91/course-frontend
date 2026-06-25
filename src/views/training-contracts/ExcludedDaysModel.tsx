// src/views/trainingContracts/tabs/ExcludedDayModal.tsx
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Dialog, DialogContent, DialogTitle, Grid, Typography } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import { excludedDayActions } from 'src/reducers/trainingContracts/ExcludedDayReducer'
import { createTrainingContractExcludedDays } from 'src/api/api'
import toast from 'react-hot-toast'

type Option = { id: number; name: string }

type FormValues = {
  beginning: string // yyyy-mm-dd
  end: string // yyyy-mm-dd
  excluded_day_type: Option | null
}

type Props = {
  open: boolean
  trainingContractId: number | null
  onSaved?: () => void
}

const ExcludedDayModal = ({ open, trainingContractId, onSaved }: Props) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const excludedDayTypes = useSelector((s: RootState) => (s as any).excludedDayType?.excludedDayTypes ?? []) as Option[]
  const typesList = useMemo(() => (Array.isArray(excludedDayTypes) ? excludedDayTypes : []), [excludedDayTypes])

  const [saving, setSaving] = useState(false)

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: { beginning: '', end: '', excluded_day_type: null }
  })

  const beginningW = watch('beginning')

  useEffect(() => {
    if (!open) return
    reset({ beginning: '', end: '', excluded_day_type: null })
  }, [open, reset])

  // reset end when beginning changes (como antes)
  useEffect(() => {
    if (!open) return
    setValue('end', '')
  }, [beginningW, open, setValue])

  const close = () => dispatch(excludedDayActions.closeExcludedDayModal())

  const onSubmit = async (data: FormValues) => {
    if (!trainingContractId) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('training_contract_id', String(trainingContractId))
      formData.append('beginning', data.beginning ?? '')
      formData.append('end', data.end ?? '')
      formData.append(
        'excluded_day_type_id',
        data.excluded_day_type?.id != null ? String(data.excluded_day_type.id) : ''
      )

      await createTrainingContractExcludedDays(formData)
      toast.success('Guardado sin problema!')
      onSaved?.()
      close()
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ textAlign: 'center', pt: 6 }}>
        <Typography variant='h4'>Añadir Fecha</Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 6 }}>
        <Box component='form' onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Controller
                name='beginning'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    type='date'
                    label='Fecha Inicio'
                    InputLabelProps={{ shrink: true }}
                    {...field}
                    disabled={saving}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name='end'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    type='date'
                    label='Fecha Fin'
                    InputLabelProps={{ shrink: true }}
                    {...field}
                    disabled={saving}
                    inputProps={{
                      min: beginningW || undefined
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name='excluded_day_type'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    value={field.value}
                    onChange={(_, v) => field.onChange(v)}
                    options={typesList}
                    getOptionLabel={o => o?.name ?? ''}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    renderInput={params => <CustomTextField {...params} label='Tipo' placeholder='Selecciona...' />}
                    disabled={saving}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
              <Button variant='contained' type='submit' disabled={saving}>
                <Icon icon='tabler:plus' fontSize={20} />
                Añadir Día
              </Button>

              <Button variant='tonal' color='secondary' onClick={close} disabled={saving}>
                <Icon icon='tabler:x' fontSize={20} />
                Cancelar
              </Button>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default ExcludedDayModal
