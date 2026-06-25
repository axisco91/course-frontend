import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'

import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// ✅ COMPANY APIs
import { createProvider, editProvider, getProvider } from 'src/api/api'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string }

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    name: yup.string().required(t('Name is required')),
    cif: yup.string().required(t('CIF is required')),
    email: yup.string().nullable().email(t('Invalid email')),
    telephone: yup.string().nullable(),
    company_type: yup.mixed<List>().nullable().required(t('Company type is required')),
    company_activity: yup.mixed<List>().nullable().required(t('Company activity is required')),
    province: yup.mixed<List>().nullable().required(t('Province is required'))
  })

type FormValues = {

  // --- Información de la empresa
  name: string
  cif: string
  legal_representative: string
  dni_legal_representative: string

  company_type: List | null
  company_activity: List | null
  cnae: List | null

  quote: string // "C. cotización" (texto)
  regimen: string
  advisor: List | null
  average_template: number | string
  sepa: string // ✅ texto (no boolean)
  b2b: string // ✅ texto (no boolean)
  iban: string
  agreement: string // ✅ texto (no boolean)

  active: boolean
  potential: boolean

  // --- Datos de contacto
  address: string
  population: string // texto
  population_code: string
  post_code: string
  province: List | null

  email: string
  telephone: string
  collaborator: List | null
  irpf: string
  commission: string
  contact_1: string
  contact_2: string
  contact_3: string

  // ids opcionales (si tu backend los usa)
  population_item: List | null
}

interface CompaniesGeneralTabProps {
  open: boolean
  mode: Mode
  providerId: number | null
  onLoaded?: (company: any) => void
  onClose?: () => void
}

const ProvidersGeneralTab: React.FC<CompaniesGeneralTabProps> = ({ open, mode, providerId, onLoaded, onClose }) => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  // ✅ lists from redux (ajusta paths si difieren)
  const companyTypes = useSelector((s: RootState) => s.companyType?.companyTypes) as List[]
  const companyActivities = useSelector((s: RootState) => s.companyActivity?.companyActivities) as List[]
  const cnaes = useSelector((s: RootState) => s.cnae?.cnaes) as List[]
  const provinces = useSelector((s: RootState) => s.province?.provinces) as List[]
  const populations = useSelector((s: RootState) => s.population?.populations) as List[]
  const advisors = useSelector((s: RootState) => s.advisor?.advisors) as List[]
  const collaborators = useSelector((s: RootState) => s.collaborator?.collaborators) as List[]

  const companyTypesList = useMemo(() => (Array.isArray(companyTypes) ? companyTypes : []), [companyTypes])
  const companyActivitiesList = useMemo(
    () => (Array.isArray(companyActivities) ? companyActivities : []),
    [companyActivities]
  )
  const cnaesList = useMemo(() => (Array.isArray(cnaes) ? cnaes : []), [cnaes])
  const provincesList = useMemo(() => (Array.isArray(provinces) ? provinces : []), [provinces])
  const populationsList = useMemo(() => (Array.isArray(populations) ? populations : []), [populations])
  const advisorsList = useMemo(() => (Array.isArray(advisors) ? advisors : []), [advisors])
  const collaboratorsList = useMemo(() => (Array.isArray(collaborators) ? collaborators : []), [collaborators])

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      // empresa
      name: '',
      cif: '',
      legal_representative: '',
      dni_legal_representative: '',

      company_type: null,
      company_activity: null,
      cnae: null,

      quote: '',
      regimen: '',
      advisor: null,
      average_template: '',
      sepa: '',
      b2b: '',
      iban: '',
      agreement: '',

      active: true,
      potential: false,

      // contacto
      address: '',
      population: '',
      population_code: '',
      post_code: '',
      province: null,

      email: '',
      telephone: '',
      collaborator: null,
      irpf: '',
      commission: '',
      contact_1: '',
      contact_2: '',
      contact_3: '',

      population_item: null
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

  const disabled = readOnly || loading || saving

  const autoCompleteInputProps = (params: any) => ({
    ...params.inputProps,
    readOnly: disabled
  })

  // ✅ load company on open
  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!providerId) return

    let cancelled = false
    const pick = (list: List[], id: any) => (id != null ? list.find(x => x.id === Number(id)) ?? null : null)

    const load = async () => {
      setLoading(true)
      try {
        const res = await getProvider(providerId)
        if (cancelled) return

        const c = res.data?.data?.provider ?? res.data?.data ?? res.data?.provider ?? null
        if (!c) throw new Error('Company payload not found')

        onLoaded?.(c)

        reset({
          name: c.name ?? '',

          // ✅ acepta cif o nif (depende de tu backend)
          cif: c.cif ?? c.nif ?? '',

          legal_representative: c.legal_representative ?? '',
          dni_legal_representative: c.dni_legal_representative ?? '',

          company_type: pick(companyTypesList, c.company_type_id),
          company_activity: pick(companyActivitiesList, c.company_activity_id),
          cnae: pick(cnaesList, c.cnae_id),

          quote: c.quote ?? '',
          regimen: c.regimen ?? '',
          advisor: pick(advisorsList, c.advisor_id),
          average_template: c.average_template ?? '',

          // ✅ ahora son string inputs
          sepa: c.sepa ?? '',
          b2b: c.b2b ?? '',
          iban: c.iban ?? '',
          agreement: c.agreement ?? '',

          active: String(c.active ?? '1') === '1' || c.active === true,
          potential: String(c.potential ?? '0') === '1' || c.potential === true,

          address: c.address ?? '',

          // tu backend tiene population_id + population (texto)
          population_item: pick(populationsList, c.population_id),
          population: c.population ?? '',
          population_code: c.population_code ?? '',
          post_code: c.post_code ?? '',
          province: pick(provincesList, c.province_id),

          email: c.email ?? '',
          telephone: c.telephone ?? '',
          collaborator: pick(collaboratorsList, c.collaborator_id),
          irpf: c.irpf ?? '',
          commission: c.commission ?? '',
          contact_1: c.contact_1 ?? '',
          contact_2: c.contact_2 ?? '',
          contact_3: c.contact_3 ?? ''
        })
      } catch (error) {
        if (!cancelled) handleError(error, logout)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, providerId])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    setSaving(true)

    try {
      const formData = new FormData()

      // empresa
      formData.append('name', data.name)

      // ✅ manda cif (si tu backend espera nif, cambia aquí a 'nif')
      formData.append('nif', data.cif)

      formData.append('legal_representative', data.legal_representative ?? '')
      formData.append('dni_legal_representative', data.dni_legal_representative ?? '')

      formData.append('company_type_id', data.company_type?.id != null ? String(data.company_type.id) : '')
      formData.append('company_activity_id', data.company_activity?.id != null ? String(data.company_activity.id) : '')
      formData.append('cnae_id', data.cnae?.id != null ? String(data.cnae.id) : '')

      formData.append('quote', data.quote ?? '')
      formData.append('regimen', data.regimen ?? '')
      formData.append('advisor_id', data.advisor?.id != null ? String(data.advisor.id) : '')
      formData.append('average_template', String(data.average_template ?? ''))

      formData.append('sepa', data.sepa ?? '')
      formData.append('b2b', data.b2b ?? '')
      formData.append('iban', data.iban ?? '')
      formData.append('agreement', data.agreement ?? '')

      formData.append('active', data.active ? '1' : '0')
      formData.append('potential', data.potential ? '1' : '0')

      // contacto
      formData.append('address', data.address ?? '')
      formData.append('population_id', data.population_item?.id != null ? String(data.population_item.id) : '')
      formData.append('population', data.population ?? '')
      formData.append('population_code', data.population_code ?? '')
      formData.append('post_code', data.post_code ?? '')
      formData.append('province_id', data.province?.id != null ? String(data.province.id) : '')

      formData.append('email', data.email ?? '')
      formData.append('telephone', data.telephone ?? '')
      formData.append('collaborator_id', data.collaborator?.id != null ? String(data.collaborator.id) : '')
      formData.append('irpf', data.irpf ?? '')
      formData.append('commission', data.commission ?? '')
      formData.append('contact_1', data.contact_1 ?? '')
      formData.append('contact_2', data.contact_2 ?? '')
      formData.append('contact_3', data.contact_3 ?? '')

      if (mode === 'create') {
        const response = await createProvider(formData)

        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
          onClose?.()
        }
      }

      if (mode === 'edit' && providerId) {
        const response = await editProvider(providerId, formData)

        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
          onClose?.()
        }
      }
    } catch (error) {
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {/* ===================================================== */}
        {/* INFORMACIÓN DE LA EMPRESA (como la captura) */}
        {/* ===================================================== */}
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Company information')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* Row 1: Nombre / CIF / Rep Legal / DNI Rep */}
          <Grid item xs={12} md={3}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Name')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='cif'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('CIF')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.cif)}
                  helperText={(errors.cif?.message as any) ?? ''}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='legal_representative'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Legal representative')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='dni_legal_representative'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Legal representative DNI')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          {/* Row 2: Tipo / Actividad / CNAE / C. cotización */}
          <Grid item xs={12} md={3}>
            <Controller
              name='company_type'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={companyTypesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Type')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.company_type)}
                      helperText={(errors.company_type as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='company_activity'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={companyActivitiesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Activity')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.company_activity)}
                      helperText={(errors.company_activity as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='cnae'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={cnaesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('CNAE')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='quote'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('C. cotización')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          {/* Row 3: Régimen / Asesoría / Plantilla media / Sepa */}
          <Grid item xs={12} md={3}>
            <Controller
              name='regimen'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Regimen')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='advisor'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={advisorsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Advisory')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='average_template'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth type='number' label={t('Average template')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='sepa'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Sepa')} {...field} disabled={disabled} />}
            />
          </Grid>

          {/* Row 4: B2B / IBAN / Activo / Potencial */}
          <Grid item xs={12} md={3}>
            <Controller
              name='b2b'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('B2B')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='iban'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Iban')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='active'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Active')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='potential'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Potential')}
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} disabled={disabled} />
                  }
                />
              )}
            />
          </Grid>

          {/* Row 5: Convenio */}
          <Grid item xs={12} md={6}>
            <Controller
              name='agreement'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Agreement')} {...field} disabled={disabled} />
              )}
            />
          </Grid>
        </Grid>

        {/* ===================================================== */}
        {/* DATOS DE CONTACTO (como la captura) */}
        {/* ===================================================== */}
        <Box sx={{ mb: 6, mt: 10 }}>
          <Typography variant='h6'>{t('Contact data')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* Row 1: Dirección / Población / Código Población / Código Postal */}
          <Grid item xs={12} md={3}>
            <Controller
              name='address'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Address')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='population'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Population')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='population_code'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Population code')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='post_code'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Post code')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          {/* Row 2: Provincia / Correo / Teléfono / Colaborador */}
          <Grid item xs={12} md={3}>
            <Controller
              name='province'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={provincesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Province')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.province)}
                      helperText={(errors.province as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Email')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message as any}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='telephone'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Telephone')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='collaborator'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={collaboratorsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Collaborator')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='irpf'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Irpf')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='commission'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Commission')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='contact_1'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Contact 1')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='contact_2'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Contact 2')} {...field} disabled={disabled} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='contact_3'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Contact 3')} {...field} disabled={disabled} />}
            />
          </Grid>
        </Grid>

        {mode !== 'view' && (
          <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', gap: 3 }}>
            <Button variant='contained' type='submit' disabled={saving || loading}>
              <Icon icon='tabler:device-floppy' fontSize={20} />
              {t('Save')}
            </Button>

            <Button variant='tonal' color='secondary' onClick={onClose} disabled={saving}>
              <Icon icon='tabler:x' fontSize={20} />
              {t('Cancel')}
            </Button>
          </Box>
        )}
      </form>

      {!saving && loading && <SavingDialog labelKey='Processing Data' />}

      {saving && <SavingDialog />}
    </Fragment>
  )
}

export default ProvidersGeneralTab
