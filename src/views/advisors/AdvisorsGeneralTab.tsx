import React, { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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

// ✅ APIs
import { editAdvisor, getAdvisor } from 'src/api/api'

type Mode = 'view' | 'edit'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string }

// ---- validation (mínimo)
const schema = (t: TranslationFunction) =>
  yup.object().shape({
    name: yup.string().required(t('Name is required')),
    nif: yup.string().required(t('CIF is required')),
    email: yup.string().nullable().email(t('Invalid email')),
    telephone: yup.string().nullable()
  })

type FormValues = {

  // ===== Información de la Asesoría =====
  name: string
  nif: string
  legal_representative: string
  dni_legal_representative: string

  company_type: List | null
  company_activity: List | null
  cnae: List | null

  // estos vienen de la COMPANY en el show (a.company.*)
  quote: string
  average_template: number | string

  // selector real
  advisor: List | null // ✅ advisor_id

  sepa: string
  b2b: string
  iban: string

  active: boolean

  irpf: string
  commission: string

  // ===== Datos de contacto =====
  address: string
  population: string
  post_code: string
  province: List | null
  population_item: List | null

  email: string
  telephone: string

  collaborator: List | null

  contact_1: string
  contact_2: string
  contact_3: string
}

interface AdvisorsGeneralTabProps {
  open: boolean
  mode: Mode
  advisorId: number | null
  onLoaded?: (advisor: any) => void
  onClose?: () => void
}

const AdvisorsGeneralTab: React.FC<AdvisorsGeneralTabProps> = ({ open, mode, advisorId, onLoaded, onClose }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ✅ lists from redux (ajusta keys si difieren)
  const advisors = useSelector((s: RootState) => s.advisor?.advisors) as List[]
  const companyTypes = useSelector((s: RootState) => s.companyType?.companyTypes) as List[]
  const companyActivities = useSelector((s: RootState) => s.companyActivity?.companyActivities) as List[]
  const cnaes = useSelector((s: RootState) => s.cnae?.cnaes) as List[]
  const provinces = useSelector((s: RootState) => s.province?.provinces) as List[]
  const populations = useSelector((s: RootState) => s.population?.populations) as List[]
  const collaborators = useSelector((s: RootState) => s.collaborator?.collaborators) as List[]

  const advisorsList = useMemo(() => (Array.isArray(advisors) ? advisors : []), [advisors])
  const companyTypesList = useMemo(() => (Array.isArray(companyTypes) ? companyTypes : []), [companyTypes])
  const companyActivitiesList = useMemo(
    () => (Array.isArray(companyActivities) ? companyActivities : []),
    [companyActivities]
  )
  const cnaesList = useMemo(() => (Array.isArray(cnaes) ? cnaes : []), [cnaes])
  const provincesList = useMemo(() => (Array.isArray(provinces) ? provinces : []), [provinces])
  const populationsList = useMemo(() => (Array.isArray(populations) ? populations : []), [populations])
  const collaboratorsList = useMemo(() => (Array.isArray(collaborators) ? collaborators : []), [collaborators])

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState(null)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      nif: '',
      legal_representative: '',
      dni_legal_representative: '',

      company_type: null,
      company_activity: null,
      cnae: null,

      quote: '',
      average_template: '',
      advisor: null,

      sepa: '',
      b2b: '',
      iban: '',

      active: true,

      irpf: '',
      commission: '',

      address: '',
      population: '',
      post_code: '',
      province: null,
      population_item: null,

      email: '',
      telephone: '',

      collaborator: null,

      contact_1: '',
      contact_2: '',
      contact_3: ''
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

  const pick = useCallback((list: List[], id: any) => {
    return id != null ? list.find(x => Number(x.id) === Number(id)) ?? null : null
  }, [])

  // ✅ load advisor on open
  useEffect(() => {
    if (!open) return
    if (!advisorId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getAdvisor(advisorId)
        if (cancelled) return

        const a = res.data?.data?.advisor ?? res.data?.data ?? res.data?.advisor ?? null
        if (!a) throw new Error('Advisor payload not found')

        setCompanyId(a.company_id)

        onLoaded?.(a)

        reset({
          name: a.name ?? '',
          nif: a.nif ?? a.cif ?? '',

          legal_representative: a.legal_representative ?? '',
          dni_legal_representative: a.dni_legal_representative ?? '',

          company_type: pick(companyTypesList, a.company_type_id),
          company_activity: pick(companyActivitiesList, a.company_activity_id),
          cnae: pick(cnaesList, a.cnae_id),

          // ✅ IMPORTANTE: vienen de la relación company
          quote: a.company?.quote ?? '',
          average_template: a.company?.average_template ?? '',

          // ✅ company selector
          advisor: pick(advisorsList, a.advisor_id),

          sepa: a.sepa ?? '',
          b2b: a.b2b ?? '',
          iban: a.iban ?? '',

          active: String(a.active ?? '1') === '1' || a.active === true,

          irpf: a.irpf ?? '',
          commission: a.commission ?? '',

          address: a.address ?? '',
          population_item: pick(populationsList, a.population_id),
          population: a.population ?? '',
          post_code: a.post_code ?? '',
          province: pick(provincesList, a.province_id),

          email: a.email ?? '',
          telephone: a.telephone ?? '',

          collaborator: pick(collaboratorsList, a.collaborator_id),

          contact_1: a.contact_1 ?? '',
          contact_2: a.contact_2 ?? '',
          contact_3: a.contact_3 ?? ''
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
  }, [
    open,
    advisorId,
    reset,
    pick,
    advisorsList,
    companyTypesList,
    companyActivitiesList,
    cnaesList,
    provincesList,
    populationsList,
    collaboratorsList
  ])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    if (!advisorId) return

    setSaving(true)

    try {
      const formData = new FormData()

      // ✅ TODOS los fillable que pasaste:
      formData.append('name', data.name ?? '')
      formData.append('advisor_id', data.advisor?.id != null ? String(data.advisor.id) : '')
      formData.append('company_id', String(companyId))
      formData.append('irpf', data.irpf ?? '')
      formData.append('commission', data.commission ?? '')
      formData.append('contact_1', data.contact_1 ?? '')
      formData.append('contact_2', data.contact_2 ?? '')
      formData.append('contact_3', data.contact_3 ?? '')

      formData.append('nif', data.nif ?? '')
      formData.append('company_type_id', data.company_type?.id != null ? String(data.company_type.id) : '')
      formData.append('company_activity_id', data.company_activity?.id != null ? String(data.company_activity.id) : '')
      formData.append('email', data.email ?? '')
      formData.append('telephone', data.telephone ?? '')

      formData.append('legal_representative', data.legal_representative ?? '')
      formData.append('dni_legal_representative', data.dni_legal_representative ?? '')
      formData.append('cnae_id', data.cnae?.id != null ? String(data.cnae.id) : '')
      formData.append('iban', data.iban ?? '')

      formData.append('sepa', data.sepa ?? '')
      formData.append('b2b', data.b2b ?? '')
      formData.append('address', data.address ?? '')
      formData.append('post_code', data.post_code ?? '')
      formData.append('population_id', data.population_item?.id != null ? String(data.population_item.id) : '')
      formData.append('province_id', data.province?.id != null ? String(data.province.id) : '')
      formData.append('population', data.population ?? '')
      formData.append('active', data.active ? '1' : '0')
      formData.append('potential', '0')
      formData.append('collaborator_id', data.collaborator?.id != null ? String(data.collaborator.id) : '')

      // ⚠️ estos 2 NO están en fillable de advisor (están en company),
      // pero los dejo porque tú los estabas enviando.
      // Si backend los ignora, no pasa nada.
      formData.append('quote', data.quote ?? '')
      formData.append('average_template', data.average_template != null ? String(data.average_template) : '')

      const response = await editAdvisor(advisorId, formData)

      if (response.data?.success) {
        toast.success(response.data?.message ?? t('Saved'))
        dispatch(generalActions.addFilterButtonClickCount())
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
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Advisory information')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* Row 1 */}
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
              name='nif'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('CIF')}
                  {...field}
                  disabled={disabled}
                  error={Boolean(errors.nif)}
                  helperText={(errors.nif?.message as any) ?? ''}
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

          {/* Row 2 */}
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
                  isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Type')}
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
              name='company_activity'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={companyActivitiesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Activity')}
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
              name='cnae'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={cnaesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
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

          {/* Row 3: COMPANY select */}
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
                  isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Advisor')}
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

          <Grid item xs={12} md={3}>
            <Controller
              name='b2b'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('B2B')} {...field} disabled={disabled} />}
            />
          </Grid>

          {/* Row 4 */}
          <Grid item xs={12} md={3}>
            <Controller
              name='irpf'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('IRPF')} {...field} disabled={disabled} />}
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

          <Grid item xs={12} md={3}>
            <Controller
              name='commission'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Commissions')} {...field} disabled={disabled} />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 6, mt: 10 }}>
          <Typography variant='h6'>{t('Contact data')}</Typography>
        </Box>

        <Grid container spacing={5}>
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
              name='post_code'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Post code')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

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
                  isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Province')}
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
                  isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
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
              name='contact_1'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Contact 1')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='contact_2'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Contact 2')} {...field} disabled={disabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name='contact_3'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Contact 3')} {...field} disabled={disabled} />
              )}
            />
          </Grid>
        </Grid>

        {mode === 'edit' && (
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

export default AdvisorsGeneralTab
