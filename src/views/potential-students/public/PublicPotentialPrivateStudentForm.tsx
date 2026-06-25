import { useEffect, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, Card, CardContent, CardHeader, Checkbox, FormControlLabel, Grid } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import { toast } from 'react-hot-toast'
import CustomTextField from 'src/@core/components/mui/text-field'
import { createPotentialStudentPublic, getLevelStudies, getProvinces, potentialStudentCheckDniPublic } from 'src/api/api'
import { potentialStudentActions } from 'src/reducers/students/PotentialStudentReducer'
import SavingDialog from 'src/views/components/SavingDialog'

type Option = { id: number; name: string }

type FormValues = {
  name: string
  surname: string
  dni: string
  telephone: string
  email: string
  date_of_birth: string
  social_security_number: string
  level_study_id: number | null
  direction: string
  post_code: string
  province_id: number | null
  population: string
  comment: string
  honeypot: string
}

const defaultValues: FormValues = {
  name: '',
  surname: '',
  dni: '',
  telephone: '',
  email: '',
  date_of_birth: '',
  social_security_number: '',
  level_study_id: null,
  direction: '',
  post_code: '',
  province_id: null,
  population: '',
  comment: '',
  honeypot: ''
}

const PublicPotentialPrivateStudentForm = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [levelStudies, setLevelStudies] = useState<Option[]>([])
  const [provinces, setProvinces] = useState<Option[]>([])

  const schema = useMemo(
    () =>
      yup.object().shape({
        email: yup.string().email(t('Invalid email')).required(t('Email required')),
        name: yup.string().min(3).required(t('Name is required')),
        surname: yup.string().min(3).required(t('Surname is required')),
        dni: yup.string().min(9).required(t('Dni is required')),
        telephone: yup.string().min(9).required(t('Telephone is required'))
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
        const [levelsRes, provincesRes] = await Promise.all([getLevelStudies(), getProvinces()])
        if (cancelled) return
        setLevelStudies(levelsRes?.data?.data?.level_studies ?? [])
        setProvinces(provincesRes?.data?.data?.provinces ?? [])
      } catch (error: any) {
        toast.error(error?.response?.data?.message || t('unexpectedError'))
      }
    }

    loadCatalogs()

    return () => {
      cancelled = true
    }
  }, [t])

  const findById = (list: Option[], id: number | null) =>
    id == null ? null : list.find(item => Number(item.id) === Number(id)) ?? null

  const onSubmit = async (data: FormValues) => {
    if (data.honeypot) return

    setSaving(true)
    try {
      const dniCheckRes = await potentialStudentCheckDniPublic({ dni: data.dni, id: '' })
      const exists = Boolean(dniCheckRes?.data?.exists)
      dispatch(potentialStudentActions.setDniExist(exists))

      if (exists) {
        toast.error('DNI ya en uso')

        return
      }

      const formData = new FormData()
      formData.append('name', data.name ?? '')
      formData.append('surname', data.surname ?? '')
      formData.append('dni', data.dni ?? '')
      formData.append('telephone', data.telephone ?? '')
      formData.append('email', data.email ?? '')
      formData.append('date_of_birth', data.date_of_birth ?? '')
      formData.append('disabled', disabled ? '1' : '0')
      formData.append('social_security_number', data.social_security_number ?? '')
      formData.append('level_study_id', data.level_study_id != null ? String(data.level_study_id) : '')
      formData.append('direction', data.direction ?? '')
      formData.append('post_code', data.post_code ?? '')
      formData.append('province_id', data.province_id != null ? String(data.province_id) : '')
      formData.append('population', data.population ?? '')
      formData.append('comment', data.comment ?? '')

      await createPotentialStudentPublic(formData)
      dispatch(potentialStudentActions.setStudentPrivateSuccess(true))
      await router.push('/potential-private-student/finalized')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('unexpectedError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title={t('Request student registration')} />
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
              <Controller
                name='surname'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label={t('Surnames')}
                    {...field}
                    error={Boolean(errors.surname)}
                    helperText={errors.surname?.message as string}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name='dni'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label={t('Dni')}
                    {...field}
                    error={Boolean(errors.dni)}
                    helperText={errors.dni?.message as string}
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
                name='date_of_birth'
                control={control}
                render={({ field }) => (
                  <CustomTextField fullWidth type='date' label={t('Date of birth')} InputLabelProps={{ shrink: true }} {...field} />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={<Checkbox checked={disabled} onChange={e => setDisabled(e.target.checked)} />}
                label={t('Disabled')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name='social_security_number'
                control={control}
                render={({ field }) => <CustomTextField fullWidth label={t('Social Security Number')} {...field} />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name='level_study_id'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={levelStudies}
                    value={findById(levelStudies, field.value)}
                    onChange={(_, value) => field.onChange(value?.id ?? null)}
                    getOptionLabel={option => option?.name ?? ''}
                    isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                    renderInput={params => <CustomTextField {...params} label={t('Level Study')} />}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller name='direction' control={control} render={({ field }) => <CustomTextField fullWidth label={t('Address')} {...field} />} />
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
                    renderInput={params => <CustomTextField {...params} label={t('Province')} />}
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

            <Grid item xs={12}>
              <Controller
                name='comment'
                control={control}
                render={({ field }) => <CustomTextField fullWidth multiline minRows={3} label={t('Comment')} {...field} />}
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'none' }}>
              <Controller name='honeypot' control={control} render={({ field }) => <CustomTextField fullWidth {...field} />} />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button type='submit' variant='contained' disabled={saving}>
                {t('Save')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
      {saving && <SavingDialog />}
    </Card>
  )
}

export default PublicPotentialPrivateStudentForm
