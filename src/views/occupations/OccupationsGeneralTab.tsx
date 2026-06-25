// LiquidationsGeneralTab.tsx
import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Box, Button, Grid } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'

import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'

import { useDispatch } from 'react-redux'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// ✅ APIs
import { createOccupation, editOccupation, getOccupation } from 'src/api/api'
import { occupationActions } from 'src/reducers/trainingContracts/OccupationsReducer'

// ✅ reducer

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    name: yup.string().nullable().required(t('Name is required'))
  })

type FormValues = {
  name: string
}

interface OccupationsGeneralTabProps {
  open: boolean
  mode: Mode
  occupationId: number | null
  onLoaded?: (liquidation: any) => void
  onClose?: () => void
}

const OccupationsGeneralTab: React.FC<OccupationsGeneralTabProps> = ({
  open,
  mode,
  occupationId,
  onLoaded,
  onClose
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      cno: ''
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
    resolver: yupResolver(schema(t)),
    shouldUnregister: false // ✅ CLAVE: aunque estén disabled/si cambias render, no se pierden
  })

  // ----------------------------
  // load liquidation (edit/view)
  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!occupationId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getOccupation(occupationId)
        if (cancelled) return

        const l = res.data?.data?.occupation ?? null
        if (!l) throw new Error('Occupation payload not found')

        onLoaded?.(l)

        reset({
          name: l.name ?? '',
          cno: l.cno ?? ''
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
  }, [open, mode, occupationId])

  // ----------------------------
  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    setSaving(true)

    try {
      const formData = new FormData()

      // ✅ editables
      formData.append('name', data.name ?? '')
      formData.append('cno', data.cno ?? '')

      if (mode === 'create') {
        const response = await createOccupation(formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())

          const newId = response.data?.data?.occupation?.id ?? response.data?.data?.id
          if (newId) {
            if (occupationActions?.setId) dispatch(occupationActions.setId(Number(newId)))
            if (occupationActions?.openModal) {
              dispatch(occupationActions.openModal({ mode: 'edit', occupationId: Number(newId) }))
            }
          }
        }
      } else if (mode === 'edit' && occupationId) {
        const response = await editOccupation(occupationId, formData)
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
          <Grid item xs={12} md={12}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Name')} {...field} />}
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <Controller
              name='cno'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('CNO')} {...field} />}
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

export default OccupationsGeneralTab
