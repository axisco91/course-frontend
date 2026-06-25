import { useContext, useEffect, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Button, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { convertPotentialCompany, getPotentialCompany } from 'src/api/api'
import { generalActions } from 'src/reducers/general/GeneralReducer'

type Mode = 'view' | 'edit' | 'create'
type List = { id: number; name: string; surname?: string }

type FormValues = {
  name: string
  nif: string
  email: string
  telephone: string
  company_type_id: number | null
  company_activity_id: number | null
  province_id: number | null
  legal_representative: string
  dni_legal_representative: string
  quote: string
  cnae_id: number | null
  advisor_id: number | null
  collaborator_id: number | null
  address: string
  post_code: string
  population: string
  iban: string
  active: boolean
  potential: boolean
}

const schema = (t: (key: string) => string) =>
  yup.object().shape({
    name: yup.string().required(t('Name is required')),
    email: yup.string().nullable().email(t('Invalid email')).notRequired(),
    telephone: yup.string().nullable().notRequired(),
    company_type_id: yup.number().nullable().required(t('Type is required')),
    company_activity_id: yup.number().nullable().required(t('Activity is required')),
    province_id: yup.number().nullable().required(t('Province is required'))
  })

const defaultValues: FormValues = {
  name: '',
  nif: '',
  email: '',
  telephone: '',
  company_type_id: null,
  company_activity_id: null,
  province_id: null,
  legal_representative: '',
  dni_legal_representative: '',
  quote: '',
  cnae_id: null,
  advisor_id: null,
  collaborator_id: null,
  address: '',
  post_code: '',
  population: '',
  iban: '',
  active: false,
  potential: true
}

const pickPayload = (res: any) =>
  res?.data?.data?.potential_company ?? res?.data?.data?.company ?? res?.data?.potential_company ?? res?.data?.data ?? null

const PotentialCompaniesGeneralTab = ({
  open,
  mode,
  potentialCompanyId,
  onClose
}: {
  open: boolean
  mode: Mode
  potentialCompanyId: number | null
  onClose?: () => void
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const companyTypes = useSelector((s: RootState) => (s as any).companyType?.companyTypes ?? []) as List[]
  const activities = useSelector((s: RootState) => (s as any).companyActivity?.companyActivities ?? []) as List[]
  const advisors = useSelector((s: RootState) => (s as any).advisor?.advisors ?? []) as List[]
  const collaborators = useSelector((s: RootState) => (s as any).collaborator?.collaborators ?? []) as List[]
  const provinces = useSelector((s: RootState) => (s as any).province?.provinces ?? []) as List[]
  const cnaes = useSelector((s: RootState) => (s as any).cnae?.cnaes ?? []) as List[]

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema(t))
  })

  useEffect(() => {
    if (!open) return
    if (!potentialCompanyId) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await getPotentialCompany(Number(potentialCompanyId))
        if (cancelled) return

        const pc = pickPayload(res)
        if (!pc) return

        reset({
          name: pc.name ?? '',
          nif: pc.nif ?? '',
          email: pc.email ?? '',
          telephone: pc.telephone ?? '',
          company_type_id: pc.company_type_id != null ? Number(pc.company_type_id) : null,
          company_activity_id: pc.company_activity_id != null ? Number(pc.company_activity_id) : null,
          province_id: pc.province_id != null ? Number(pc.province_id) : null,
          legal_representative: pc.legal_representative ?? '',
          dni_legal_representative: pc.dni_legal_representative ?? '',
          quote: pc.quote ?? '',
          cnae_id: pc.cnae_id != null ? Number(pc.cnae_id) : null,
          advisor_id: pc.advisor_id != null ? Number(pc.advisor_id) : null,
          collaborator_id: pc.collaborator_id != null ? Number(pc.collaborator_id) : null,
          address: pc.address ?? '',
          post_code: pc.post_code ?? '',
          population: pc.population ?? '',
          iban: pc.iban ?? '',
          active: String(pc.active ?? '0') === '1',
          potential: String(pc.potential ?? '1') === '1'
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
  }, [open, potentialCompanyId, reset, handleError, logout])

  const onSubmit = async (values: FormValues) => {
    if (readOnly) return
    if (!potentialCompanyId) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', values.name ?? '')
      formData.append('nif', values.nif ?? '')
      formData.append('company_type_id', values.company_type_id != null ? String(values.company_type_id) : '')
      formData.append('company_activity_id', values.company_activity_id != null ? String(values.company_activity_id) : '')
      formData.append('email', values.email ?? '')
      formData.append('telephone', values.telephone ?? '')
      formData.append('legal_representative', values.legal_representative ?? '')
      formData.append('dni_legal_representative', values.dni_legal_representative ?? '')
      formData.append('quote', values.quote ?? '')
      formData.append('cnae_id', values.cnae_id != null ? String(values.cnae_id) : '')
      formData.append('advisor_name', values.advisor_id != null ? String(values.advisor_id) : '')
      formData.append('collaborator_id', values.collaborator_id != null ? String(values.collaborator_id) : '')
      formData.append('address', values.address ?? '')
      formData.append('post_code', values.post_code ?? '')
      formData.append('province_id', values.province_id != null ? String(values.province_id) : '')
      formData.append('population', values.population ?? '')
      formData.append('iban', values.iban ?? '')
      formData.append('active', values.active ? '1' : '0')
      formData.append('potential', values.potential ? '1' : '0')

      await convertPotentialCompany(Number(potentialCompanyId), formData)
      dispatch(generalActions.addFilterButtonClickCount())
      onClose?.()
    } catch (error) {
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  const disabled = readOnly || saving || loading
  const byId = (list: List[], id: any) => (id == null ? null : list.find(x => Number(x.id) === Number(id)) ?? null)

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={5}>
        <Grid item xs={12} md={6}>
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
                helperText={errors.name?.message as string}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name='nif' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Cif')} {...field} disabled={disabled} />} />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name='company_type_id'
            control={control}
            render={({ field }) => (
              <Autocomplete
                value={byId(companyTypes, field.value)}
                onChange={(_, val) => field.onChange(val?.id ?? null)}
                options={companyTypes}
                getOptionLabel={o => o?.name ?? ''}
                isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                disabled={disabled}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label={t('Type')}
                    error={Boolean(errors.company_type_id)}
                    helperText={errors.company_type_id?.message as string}
                  />
                )}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name='company_activity_id'
            control={control}
            render={({ field }) => (
              <Autocomplete
                value={byId(activities, field.value)}
                onChange={(_, val) => field.onChange(val?.id ?? null)}
                options={activities}
                getOptionLabel={o => o?.name ?? ''}
                isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                disabled={disabled}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label={t('Activity')}
                    error={Boolean(errors.company_activity_id)}
                    helperText={errors.company_activity_id?.message as string}
                  />
                )}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller name='email' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Email')} {...field} disabled={disabled} />} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name='telephone' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Telephone')} {...field} disabled={disabled} />} />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller name='legal_representative' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Legal representative')} {...field} disabled={disabled} />} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name='dni_legal_representative' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Legal representative dni')} {...field} disabled={disabled} />} />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller name='quote' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Quote')} {...field} disabled={disabled} />} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name='cnae_id'
            control={control}
            render={({ field }) => (
              <Autocomplete
                value={byId(cnaes, field.value)}
                onChange={(_, val) => field.onChange(val?.id ?? null)}
                options={cnaes}
                getOptionLabel={o => o?.name ?? ''}
                isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                disabled={disabled}
                renderInput={params => <CustomTextField {...params} label={t('Cnae')} />}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name='advisor_id'
            control={control}
            render={({ field }) => (
              <Autocomplete
                value={byId(advisors, field.value)}
                onChange={(_, val) => field.onChange(val?.id ?? null)}
                options={advisors}
                getOptionLabel={o => o?.name ?? ''}
                isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                disabled={disabled}
                renderInput={params => <CustomTextField {...params} label={t('Advisor')} />}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name='collaborator_id'
            control={control}
            render={({ field }) => (
              <Autocomplete
                value={byId(collaborators, field.value)}
                onChange={(_, val) => field.onChange(val?.id ?? null)}
                options={collaborators}
                getOptionLabel={o => (o ? `${o.name ?? ''} ${o.surname ?? ''}`.trim() : '')}
                isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                disabled={disabled}
                renderInput={params => <CustomTextField {...params} label={t('Collaborator')} />}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller name='address' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Address')} {...field} disabled={disabled} />} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name='post_code' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Post code')} {...field} disabled={disabled} />} />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name='province_id'
            control={control}
            render={({ field }) => (
              <Autocomplete
                value={byId(provinces, field.value)}
                onChange={(_, val) => field.onChange(val?.id ?? null)}
                options={provinces}
                getOptionLabel={o => o?.name ?? ''}
                isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                disabled={disabled}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label={t('Province')}
                    error={Boolean(errors.province_id)}
                    helperText={errors.province_id?.message as string}
                  />
                )}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller name='population' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Population')} {...field} disabled={disabled} />} />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller name='iban' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Iban')} {...field} disabled={disabled} />} />
        </Grid>

        {!readOnly && (
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button type='submit' variant='contained' disabled={saving || loading}>
              {t('Convert')}
            </Button>
          </Grid>
        )}
      </Grid>

      {!saving && loading && <SavingDialog labelKey='Processing Data' />}

      {saving && <SavingDialog />}
    </form>
  )
}

export default PotentialCompaniesGeneralTab
