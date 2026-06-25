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
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// ✅ Ajusta a tus endpoints reales
import { createCompanyIncidence, editCompanyIncidence, getCompanyIncidence } from 'src/api/api'

type Mode = 'create' | 'edit'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string }

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    affair: yup.string().required(t('Subject is required')),
    incidence_type: yup.mixed<List>().nullable().required(t('Type is required')),
    user: yup.mixed<List>().nullable().required(t('User is required')),
    notes: yup.string().required(t('Observation is required'))
  })

type FormValues = {
  affair: string
  incidence_type: List | null
  user: List | null
  notes: string
}

interface CompanyIncidenceModalProps {
  open: boolean
  mode: Mode
  companyId: number
  incidenceId?: number | null
  onClose: () => void
  onSaved?: () => void
}

const CompanyIncidenceModal: React.FC<CompanyIncidenceModalProps> = ({
  open,
  mode,
  companyId,
  incidenceId = null,
  onClose,
  onSaved
}) => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  // ✅ Listas redux (ajusta keys si en tu store se llaman distinto)
  const incidenceTypes = useSelector((s: RootState) => s.incidenceType?.incidenceTypes ?? []) as List[]
  const users = useSelector((s: RootState) => s.user?.users ?? [])
  const companies = useSelector((s: RootState) => s.company?.companies ?? []) as List[]

  const incidenceTypesList = useMemo(() => (Array.isArray(incidenceTypes) ? incidenceTypes : []), [incidenceTypes])
  const usersList = useMemo(() => (Array.isArray(users) ? users : []), [users])
  const companiesList = useMemo(() => (Array.isArray(companies) ? companies : []), [companies])

  // ✅ Empresa seleccionada (solo visual, disabled)
  const selectedCompany = useMemo<List | null>(() => {
    return companiesList.find(c => Number(c.id) === Number(companyId)) ?? null
  }, [companiesList, companyId])

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      affair: '',
      incidence_type: null,
      user: null,
      notes: ''
    }),
    []
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

  const pick = (list: List[], id: any) => (id != null ? list.find(x => x.id === Number(id)) ?? null : null)

  useEffect(() => {
    if (!open) return

    // create -> limpio
    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    // edit -> cargo
    if (!incidenceId) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await getCompanyIncidence(incidenceId, { company_id: companyId })
        if (cancelled) return

        const data = res.data?.data
        const inc = data?.incidence ?? data?.company_incidence ?? data ?? null

        reset({
          affair: inc?.affair ?? '',
          notes: inc?.notes ?? '',
          incidence_type: pick(incidenceTypesList, inc?.incidence_type_id ?? inc?.incidenceTypeId),
          user: pick(usersList, inc?.user_id ?? inc?.userId)
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
  }, [open, mode, incidenceId, reset, defaultValues])

  const onSubmit: SubmitHandler<FormValues> = async data => {
    if (!open) return
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('company_id', String(companyId))
      formData.append('affair', data.affair ?? '')
      formData.append('notes', data.notes ?? '')
      formData.append('incidence_type_id', data.incidence_type?.id != null ? String(data.incidence_type.id) : '')
      formData.append('user_id', data.user?.id != null ? String(data.user.id) : '')

      if (mode === 'create') {
        const r = await createCompanyIncidence(formData)
        if (r.data?.success) toast.success(r.data?.message ?? t('Saved'))
      } else {
        if (!incidenceId) return
        const r = await editCompanyIncidence(incidenceId, formData)
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
          {mode === 'create' ? t('New incidence') : t('Edit incidence')}
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
        {/* SIN <form> para evitar autosubmit */}
        <Grid container spacing={4}>
          {/* Asunto */}
          <Grid item xs={12} md={4}>
            <Controller
              name='affair'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Subject')}
                  placeholder={t('Subject')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.affair)}
                  helperText={errors.affair?.message as any}
                />
              )}
            />
          </Grid>

          {/* Empresa (Autocomplete disabled mostrando nombre) */}
          <Grid item xs={12} md={4}>
            <Autocomplete
              value={selectedCompany}
              options={companiesList}
              getOptionLabel={o => o?.name ?? ''}
              isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
              disabled
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label={t('Company')}
                  placeholder={t('Select...')}
                  disabled
                  inputProps={{ ...params.inputProps, readOnly: true }}
                />
              )}
            />
          </Grid>

          {/* Tipo */}
          <Grid item xs={12} md={4}>
            <Controller
              name='incidence_type'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={incidenceTypesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(option, value) => Number(option?.id) === Number(value?.id)}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Type')}
                      placeholder={t('Select...')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.incidence_type)}
                      helperText={(errors.incidence_type as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Usuario */}
          <Grid item xs={12} md={4}>
            <Controller
              name='user'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={usersList}
                  getOptionLabel={o => o?.name + ' ' + o?.surname}
                  isOptionEqualToValue={(option, value) => Number(option?.id) === Number(value?.id)}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('User')}
                      placeholder={t('Select...')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.user)}
                      helperText={(errors.user as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Observación */}
          <Grid item xs={12}>
            <Controller
              name='notes'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  multiline
                  minRows={5}
                  label={t('Observation')}
                  placeholder={t('Observation')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.notes)}
                />
              )}
            />
            {errors.notes && <FormHelperText error>{String(errors.notes.message ?? '')}</FormHelperText>}
          </Grid>
        </Grid>

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

export default CompanyIncidenceModal
