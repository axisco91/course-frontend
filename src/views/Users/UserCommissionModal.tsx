import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import toast from 'react-hot-toast'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useTranslation } from 'react-i18next'

import { useDispatch, useSelector } from 'react-redux'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from 'src/views/components/SavingDialog'

// ✅ APIs reales
import { getUserCommission, getUserCommissionTypes, editUserCommission } from 'src/api/api'

// ✅ reducer
import { userCommissionActions } from 'src/reducers/users/UserCommissionReducer'
import { generalActions } from 'src/reducers/general/GeneralReducer'

const toNum = v => {
  const n = Number(String(v ?? '').replace(',', '.'))

  return Number.isFinite(n) ? n : 0
}

const schema = (t: (k: string) => string) =>
  yup.object({
    commission_type_id: yup
      .mixed()
      .test('required', t('Type is required'), v => v !== null && v !== undefined && String(v) !== ''),
    percentage: yup.number().typeError(t('Invalid percentage')).min(0, t('Minimum 0')).required(t('Required')),
    amount: yup.number().typeError(t('Invalid advisory total')).min(0, t('Minimum 0')).required(t('Required')),
    bill_amount: yup.number().typeError(t('Invalid total')).min(0, t('Minimum 0')).required(t('Required'))
  })

const UserCommissionModal = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  // redux modal state
  const modalOpen = useSelector(state => state.userCommission?.modalOpen)
  const commissionId = useSelector(state => state.userCommission?.id)
  const mode = useSelector(state => state.userCommission?.mode || 'edit') // view/edit/create si lo usas

  const disabledAll = mode === 'view'

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [types, setTypes] = useState([])

  const defaultValues = useMemo(
    () => ({
      commission_type_id: '',
      percentage: '',
      amount: '',
      bill_amount: ''
    }),
    []
  )

  const { control, reset, handleSubmit, watch, setValue } = useForm({
    defaultValues,
    resolver: yupResolver(schema(t)),
    shouldUnregister: false
  })

  const percentage = watch('percentage')
  const billAmount = watch('bill_amount')

  // ✅ Recalcular amount automáticamente cuando cambian % o bill_amount
  // (si quieres que amount sea siempre calculado, déjalo. Si quieres permitir editarlo manualmente,
  // comenta este effect o añade una condición.)
  useEffect(() => {
    if (!modalOpen) return
    if (disabledAll) return

    const p = toNum(percentage)
    const b = toNum(billAmount)
    if (!p || !b) {
      // setValue('amount', '0')
      return
    }

    const calc = ((p / 100) * b).toFixed(2)
    setValue('amount', calc, { shouldDirty: true })
  }, [percentage, billAmount, modalOpen, disabledAll, setValue])

  const close = useCallback(() => {
    dispatch(userCommissionActions.closeModal())
  }, [dispatch])

  // ✅ cargar catálogo tipos
  useEffect(() => {
    if (!modalOpen) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await getUserCommissionTypes()

        const list = res.data?.data?.commission_types ?? res.data?.data?.types ?? res.data?.data ?? res.data ?? []

        if (cancelled) return

        setTypes(
          Array.isArray(list)
            ? list.map(t => ({
                id: Number(t.id ?? t.value),
                name: String(t.name ?? t.label ?? '')
              }))
            : []
        )
      } catch (e) {
        if (!cancelled) handleErrorRef.current(e, logoutRef.current)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [modalOpen])

  // ✅ cargar comisión
  useEffect(() => {
    if (!modalOpen) return

    if (mode === 'create') {
      reset(defaultValues)

      return
    }

    if (!commissionId) return

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await getUserCommission(commissionId)

        const data = res.data?.data?.user_commission ?? res.data?.data?.commission ?? res.data?.data ?? res.data ?? null

        if (cancelled) return
        if (!data) throw new Error(t('Commission payload not found'))

        reset({
          commission_type_id: data.commission_type_id ?? data.type_id ?? data.commission_type?.id ?? '',
          percentage: data.percentage ?? '',
          amount: data.amount ?? '',
          bill_amount: data.bill_amount ?? ''
        })
      } catch (e) {
        if (!cancelled) handleErrorRef.current(e, logoutRef.current)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [modalOpen, mode, commissionId, reset, defaultValues])

  const onSubmit = async values => {
    if (disabledAll) return
    if (!commissionId && mode !== 'create') return

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('commission_type_id', String(values.commission_type_id ?? ''))
      fd.append('percentage', String(toNum(values.percentage)))
      fd.append('amount', String(toNum(values.amount)))
      fd.append('bill_amount', String(toNum(values.bill_amount)))

      // ✅ tu endpoint real
      const res = await editUserCommission(commissionId, fd)

      if (res?.status !== 200) {
        toast.error(res?.data?.message ?? t('No se pudo guardar'))

        return
      }
      dispatch(generalActions.addFilterButtonClickCount())
      toast.success(t('Saved'))
      dispatch(userCommissionActions.bumpReload?.() ?? { type: 'userCommission/bumpReload' })
      close()
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Fragment>
      <Dialog
        open={Boolean(modalOpen)}
        onClose={saving ? undefined : close}
        data-backdrop-confirm={saving ? 'off' : undefined}
        fullWidth
        maxWidth='md'
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant='h6'>{disabledAll ? t('View commission') : t('Edit commission')}</Typography>

          <Button onClick={close} disabled={saving} startIcon={<Icon icon='tabler:x' />}>
            {t('Close')}
          </Button>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Controller
                  name='commission_type_id'
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      select
                      fullWidth
                      label={t('Commission type')}
                      {...field}
                      disabled // ✅ como tu versión vieja: NO editable
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    >
                      {types.map(t => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name='percentage'
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      fullWidth
                      label={t('Percentage')}
                      type='number'
                      inputProps={{ step: '0.01' }}
                      {...field}
                      disabled={disabledAll || loading}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name='amount'
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      fullWidth
                      label={t('Advisory total')}
                      type='number'
                      inputProps={{ step: '0.01' }}
                      {...field}
                      disabled={disabledAll || loading}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name='bill_amount'
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      fullWidth
                      label={t('Total')}
                      type='number'
                      inputProps={{ step: '0.01' }}
                      {...field}
                      disabled={disabledAll || loading}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 4 }}>
          <Button variant='outlined' onClick={close} disabled={saving}>
            {t('Cancel')}
          </Button>

          {!disabledAll && (
            <Button variant='contained' onClick={handleSubmit(onSubmit)} disabled={saving || loading}>
              <Icon icon='tabler:device-floppy' fontSize={18} />
              {t('Save')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {!saving && loading && <SavingDialog labelKey='Processing Data' />}

      {saving && <SavingDialog />}
    </Fragment>
  )
}

export default UserCommissionModal
