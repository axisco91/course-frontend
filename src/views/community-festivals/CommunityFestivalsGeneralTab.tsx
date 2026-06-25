import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, Grid } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'

import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { festivalLabel } from 'src/utils/festivalLabel'

import { createCommunityFestival, editCommunityFestival } from 'src/api/api'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string; day?: string }

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    community: yup.mixed<List>().nullable().required(t('Community is required')),
    festival: yup.mixed<List>().nullable().required(t('Festival is required'))
  })

type FormValues = {
  community: List | null
  festival: List | null
  day: string
}

interface CommunityFestivalsGeneralTabProps {
  open: boolean
  mode: Mode
  communityFestivalId: number | null
  onClose?: () => void
}

const CommunityFestivalsGeneralTab: React.FC<CommunityFestivalsGeneralTabProps> = ({
  open,
  mode,
  communityFestivalId,
  onClose
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const communities = useSelector((state: RootState) => (state as any).community?.communities ?? []) as List[]
  const festivals = useSelector((state: RootState) => (state as any).nacionalFestival?.nacionalFestivals ?? []) as List[]
  const current = useSelector(
    (state: RootState) => (state as any).communityFestival?.currentCommunityFestival ?? null
  ) as any

  const communitiesList = useMemo(() => (Array.isArray(communities) ? communities : []), [communities])
  const festivalsList = useMemo(() => (Array.isArray(festivals) ? festivals : []), [festivals])

  const defaultValues = useMemo<FormValues>(
    () => ({
      community: null,
      festival: null,
      day: ''
    }),
    []
  )

  const {
    reset,
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema(t)),
    shouldUnregister: false
  })

  const festivalWatch = watch('festival')

  useEffect(() => {
    const day = String((festivalWatch as any)?.day ?? '').slice(0, 10)
    setValue('day', day)
  }, [festivalWatch, setValue])

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!communityFestivalId) return

    setLoading(true)

    const item = current ?? {}
    const communityId = item.community_id ?? item.community?.id ?? null
    const festivalId = item.festival_id ?? item.nacional_festival_id ?? item.festival?.id ?? item.nacional_festival?.id ?? null

    const selectedCommunity =
      communityId != null ? communitiesList.find(c => Number(c.id) === Number(communityId)) ?? null : null
    const selectedFestival =
      festivalId != null ? festivalsList.find(f => Number(f.id) === Number(festivalId)) ?? null : null

    reset({
      community: selectedCommunity,
      festival: selectedFestival,
      day: String(item.day ?? item.festival?.day ?? item.nacional_festival?.day ?? selectedFestival?.day ?? '').slice(0, 10)
    })

    setLoading(false)
  }, [open, mode, communityFestivalId, current, communitiesList, festivalsList, reset, defaultValues])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('community_id', data.community?.id != null ? String(data.community.id) : '')

      const festivalId = data.festival?.id != null ? String(data.festival.id) : ''
      formData.append('festival_id', festivalId)
      formData.append('nacional_festival_id', festivalId)

      if (mode === 'create') {
        const response = await createCommunityFestival(formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
          onClose?.()
        }
      } else if (mode === 'edit' && communityFestivalId) {
        const response = await editCommunityFestival(communityFestivalId, formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
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
        <Grid container spacing={5}>
          <Grid item xs={12} md={6}>
            <Controller
              name='community'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={communitiesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                  disabled={readOnly || loading || saving}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Community')}
                      error={Boolean(errors.community)}
                      helperText={(errors.community as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='festival'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={festivalsList}
                  getOptionLabel={festivalLabel}
                  isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
                  disabled={readOnly || loading || saving}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Festival')}
                      error={Boolean(errors.festival)}
                      helperText={(errors.festival as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='day'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='date'
                  label={t('Day')}
                  InputLabelProps={{ shrink: true }}
                  {...field}
                  disabled
                />
              )}
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

export default CommunityFestivalsGeneralTab
