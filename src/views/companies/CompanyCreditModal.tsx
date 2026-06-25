import React, { useContext, useEffect, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, Dialog, DialogContent, DialogTitle, FormHelperText, Grid, IconButton, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'
import { useDispatch } from 'react-redux'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// ✅ AJUSTA estos endpoints a los tuyos reales:
import { createCredit, editCredit, getCredit } from 'src/api/api'

type Mode = 'create' | 'edit'
type TranslationFunction = (key: string) => string
type YearOption = { id: number; name: string } // para usar Autocomplete como siempre

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    available_credit: yup
      .number()
      .typeError(t('Available credit must be a number'))
      .required(t('Available credit is required')),
    consumed_credit: yup
      .number()
      .typeError(t('Consumed credit must be a number'))
      .required(t('Consumed credit is required')),
    year: yup.mixed<YearOption>().nullable().required(t('Year is required'))
  })

type FormValues = {
  available_credit: number | string
  consumed_credit: number | string
  year: YearOption | null
}

interface CompanyCreditModalProps {
  open: boolean
  mode: Mode
  companyId: number
  creditId?: number | null
  onClose: () => void
  onSaved?: () => void
}

const buildYears = (from = 2018, to?: number): YearOption[] => {
  const end = to ?? new Date().getFullYear() + 1
  const arr: YearOption[] = []
  for (let y = end; y >= from; y--) arr.push({ id: y, name: String(y) })

  return arr
}

const CompanyCreditModal: React.FC<CompanyCreditModalProps> = ({
  open,
  mode,
  companyId,
  creditId = null,
  onClose,
  onSaved
}) => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const yearsList = useMemo(() => buildYears(2018), [])
  const defaultValues = useMemo<FormValues>(
    () => ({
      available_credit: '',
      consumed_credit: '',
      year: yearsList[0] ?? null
    }),
    [yearsList]
  )

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema(t))
  })

  const pickYear = (y: any) => {
    const n = Number(y)
    if (!Number.isFinite(n)) return null

    return yearsList.find(x => x.id === n) ?? { id: n, name: String(n) }
  }

  useEffect(() => {
    if (!open) return

    // create -> limpio
    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    // edit -> cargo
    if (!creditId) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await getCredit(creditId, { company_id: companyId })
        if (cancelled) return

        const data = res.data?.data
        const c = data?.credit ?? data?.company_credit ?? data ?? null

        reset({
          available_credit: c?.available_credit ?? '',
          consumed_credit: c?.consumed_credit ?? '',
          year: pickYear(c?.year)
        })
      } catch (e) {
        if (!cancelled) handleError(e, logout)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [open, mode, creditId, reset, defaultValues]) // yearsList ya está dentro de defaultValues

  const onSubmit: SubmitHandler<FormValues> = async data => {
    if (!open) return
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('company_id', String(companyId))
      formData.append('available_credit', String(data.available_credit ?? ''))
      formData.append('consumed_credit', String(data.consumed_credit ?? ''))
      formData.append('year', data.year?.id != null ? String(data.year.id) : '')

      if (mode === 'create') {
        const r = await createCredit(formData)
        if (r.data?.success) toast.success(r.data?.message ?? t('Saved'))
      } else {
        if (!creditId) return
        const r = await editCredit(creditId, formData)
        if (r.data?.success) toast.success(r.data?.message ?? t('Saved'))
      }

      dispatch(generalActions.addFilterButtonClickCount())
      onSaved?.()
      onClose()
    } catch (e) {
      handleError(e, logout)
    } finally {
      setSaving(false)
    }
  }

  const disabled = loading || saving
  const autoCompleteInputProps = (params: any) => ({
    ...params.inputProps,
    readOnly: disabled
  })

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth='md'
      onClose={() => {
        if (saving) return
        onClose()
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          {mode === 'create' ? t('New credit') : t('Edit credit')}
        </Typography>

        <IconButton
          onClick={() => {
            if (saving) return
            onClose()
          }}
        >
          <Icon icon='tabler:x' fontSize={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Controller
              name='available_credit'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Available credit')}
                  placeholder={t('Available credit')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.available_credit)}
                  helperText={errors.available_credit?.message as any}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='consumed_credit'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Consumed credit')}
                  placeholder={t('Consumed credit')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.consumed_credit)}
                  helperText={errors.consumed_credit?.message as any}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='year'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={yearsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Year')}
                      placeholder={t('Select...')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.year)}
                      helperText={(errors.year as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>

        {(errors.year || errors.available_credit || errors.consumed_credit) && (
          <Box sx={{ mt: 2 }}>
            {errors.year && <FormHelperText error>{String((errors.year as any)?.message ?? '')}</FormHelperText>}
          </Box>
        )}

        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Button variant='contained' type='button' disabled={disabled} onClick={handleSubmit(onSubmit)}>
            <Icon icon='tabler:device-floppy' fontSize={20} />
            {t('Save')}
          </Button>

          <Button variant='tonal' color='secondary' type='button' disabled={disabled} onClick={onClose}>
            <Icon icon='tabler:x' fontSize={20} />
            {t('Cancel')}
          </Button>
        </Box>

        {!saving && loading && <SavingDialog labelKey='Processing Data' />}

        {saving && <SavingDialog />}
      </DialogContent>
    </Dialog>
  )
}

export default CompanyCreditModal
