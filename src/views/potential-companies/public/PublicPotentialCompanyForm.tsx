import { useContext, useEffect, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, Card, CardContent, CardHeader, Grid, Typography } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import {
  createPotentialCompanyPublic,
  getCnaes,
  getCompanyActivities,
  getCompanyTypes,
  getProvinces
} from 'src/api/api'
import { potentialCompanyActions } from 'src/reducers/company/PotentialCompanyReducer'
import SavingDialog from 'src/views/components/SavingDialog'

type Option = { id: number; name: string }

type FormValues = {
  name: string
  nif: string
  company_type_id: number | null
  company_activity_id: number | null
  email: string
  telephone: string
  legal_representative: string
  dni_legal_representative: string
  quote: string
  advisor: string
  cnae_id: number | null
  average_template: string
  iban: string
  sepa: string
  b2b: string
  address: string
  post_code: string
  province_id: number | null
  population: string
}

const defaultValues: FormValues = {
  name: '',
  nif: '',
  company_type_id: null,
  company_activity_id: null,
  email: '',
  telephone: '',
  legal_representative: '',
  dni_legal_representative: '',
  quote: '',
  advisor: '',
  cnae_id: null,
  average_template: '',
  iban: '',
  sepa: '',
  b2b: '',
  address: '',
  post_code: '',
  province_id: null,
  population: ''
}

const PublicPotentialCompanyForm = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const [saving, setSaving] = useState(false)
  const [companyTypes, setCompanyTypes] = useState<Option[]>([])
  const [companyActivities, setCompanyActivities] = useState<Option[]>([])
  const [provinces, setProvinces] = useState<Option[]>([])
  const [cnaes, setCnaes] = useState<Option[]>([])

  const schema = useMemo(
    () =>
      yup.object().shape({
        name: yup.string().min(3).required(t('Name is required')),
        email: yup.string().email(t('Invalid email')).required(t('Email required')),
        telephone: yup.string().min(9).required(t('Telephone is required')),
        company_type_id: yup.number().nullable().required(t('Type is required')),
        company_activity_id: yup.number().nullable().required(t('Activity is required')),
        province_id: yup.number().nullable().required(t('Province is required'))
      }),
    [t]
  )

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema)
  })

  useEffect(() => {
    let cancelled = false

    const loadCatalogs = async () => {
      try {
        const [typesRes, activitiesRes, provincesRes, cnaesRes] = await Promise.all([
          getCompanyTypes(),
          getCompanyActivities(),
          getProvinces(),
          getCnaes()
        ])

        if (cancelled) return

        setCompanyTypes(typesRes?.data?.data?.company_types ?? [])
        setCompanyActivities(activitiesRes?.data?.data?.company_activities ?? [])
        setProvinces(provincesRes?.data?.data?.provinces ?? [])
        setCnaes(cnaesRes?.data?.data?.cnaes ?? [])
      } catch (error) {
        if (!cancelled) handleError(error, logout)
      }
    }

    loadCatalogs()

    return () => {
      cancelled = true
    }
  }, [handleError, logout])

  const findById = (list: Option[], id: number | null) =>
    id == null ? null : list.find(item => Number(item.id) === Number(id)) ?? null

  const onSubmit = async (data: FormValues) => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name ?? '')
      formData.append('nif', data.nif ?? '')
      formData.append('company_type_id', data.company_type_id != null ? String(data.company_type_id) : '')
      formData.append('company_activity_id', data.company_activity_id != null ? String(data.company_activity_id) : '')
      formData.append('email', data.email ?? '')
      formData.append('telephone', data.telephone ?? '')
      formData.append('legal_representative', data.legal_representative ?? '')
      formData.append('dni_legal_representative', data.dni_legal_representative ?? '')
      formData.append('quote', data.quote ?? '')
      formData.append('cnae_id', data.cnae_id != null ? String(data.cnae_id) : '')
      formData.append('average_template', data.average_template ?? '')
      formData.append('iban', data.iban ?? '')
      formData.append('sepa', data.sepa ?? '')
      formData.append('b2b', data.b2b ?? '')
      formData.append('address', data.address ?? '')
      formData.append('post_code', data.post_code ?? '')
      formData.append('province_id', data.province_id != null ? String(data.province_id) : '')
      formData.append('population', data.population ?? '')
      formData.append('advisor_name', data.advisor ?? '')

      await createPotentialCompanyPublic(formData)
      dispatch(potentialCompanyActions.setCompanySuccess(true))
      await router.push('/potential-company/finalized')
    } catch (error) {
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title={t('Request company registration')} />
      <CardContent>
        <Box component='form' onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={5}>
            <Grid item xs={12} md={4}>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label={t('Name')}
                    {...field}
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message as string}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name='nif' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Cif')} {...field} />} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name='company_type_id'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={companyTypes}
                    value={findById(companyTypes, field.value)}
                    onChange={(_, value) => field.onChange(value?.id ?? null)}
                    getOptionLabel={option => option?.name ?? ''}
                    isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
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

            <Grid item xs={12} md={4}>
              <Controller
                name='company_activity_id'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={companyActivities}
                    value={findById(companyActivities, field.value)}
                    onChange={(_, value) => field.onChange(value?.id ?? null)}
                    getOptionLabel={option => option?.name ?? ''}
                    isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
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
            <Grid item xs={12} md={4}>
              <Controller
                name='email'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label={t('Email')}
                    {...field}
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message as string}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name='telephone'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label={t('Telephone')}
                    {...field}
                    error={Boolean(errors.telephone)}
                    helperText={errors.telephone?.message as string}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name='legal_representative'
                control={control}
                render={({ field }) => <CustomTextField fullWidth label={t('Legal representative')} {...field} />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name='dni_legal_representative'
                control={control}
                render={({ field }) => <CustomTextField fullWidth label={t('Legal representative dni')} {...field} />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name='quote' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Quote')} {...field} />} />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller name='advisor' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Advisor')} {...field} />} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name='cnae_id'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={cnaes}
                    value={findById(cnaes, field.value)}
                    onChange={(_, value) => field.onChange(value?.id ?? null)}
                    getOptionLabel={option => option?.name ?? ''}
                    isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                    renderInput={params => <CustomTextField {...params} label={t('Cnae')} />}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name='average_template'
                control={control}
                render={({ field }) => <CustomTextField fullWidth label={t('Average template')} {...field} />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller name='iban' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Iban')} {...field} />} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name='sepa' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Sepa')} {...field} />} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name='b2b' control={control} render={({ field }) => <CustomTextField fullWidth label={t('B2B')} {...field} />} />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller name='address' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Address')} {...field} />} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name='post_code' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Post code')} {...field} />} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name='province_id'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={provinces}
                    value={findById(provinces, field.value)}
                    onChange={(_, value) => field.onChange(value?.id ?? null)}
                    getOptionLabel={option => option?.name ?? ''}
                    isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
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
            <Grid item xs={12} md={4}>
              <Controller
                name='population'
                control={control}
                render={({ field }) => <CustomTextField fullWidth label={t('Population')} {...field} />}
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button type='submit' variant='contained' disabled={saving}>
                <Typography sx={{ color: 'common.white', fontWeight: 600 }}>{t('Save')}</Typography>
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
      {saving && <SavingDialog />}
    </Card>
  )
}

export default PublicPotentialCompanyForm
