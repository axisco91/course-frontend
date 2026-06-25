// src/views/training-contracts/tabs/TrainingContractAdditionalClauseTab.tsx

import React, { Fragment, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Grid, Typography } from '@mui/material'
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

// ✅ APIs (ajusta si tu export difiere)
import { additionalClauseTrainingContract, getTrainingContract } from 'src/api/api'

// ✅ reducers (ajusta rutas si difieren)
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'

type FormValues = {
  document_additional_clause: string
}

interface Props {
  open: boolean
  trainingContractId: number | null
}

const schema = () =>
  yup.object().shape({
    document_additional_clause: yup.string().nullable()
  })

const TrainingContractAdditionalClauseTab: React.FC<Props> = ({ open, trainingContractId }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ✅ stable refs
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const disabledAll = loading || saving

  const defaultValues = useMemo<FormValues>(
    () => ({
      document_additional_clause: ''
    }),
    []
  )

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema())
  })

  // ✅ Load clause from backend
  useEffect(() => {
    if (!open) return

    if (!trainingContractId) {
      reset(defaultValues)

      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getTrainingContract(trainingContractId)
        if (cancelled) return

        const sc =
          res?.data?.data?.training_contract ??
          res?.data?.data?.trainingContract ??
          res?.data?.data ??
          res?.data ??
          null

        if (!sc) throw new Error('Training contract payload not found')

        const clause = String(sc.document_additional_clause ?? '')
        reset({ document_additional_clause: clause })
      } catch (e) {
        if (!cancelled) handleErrorRef.current(e, logoutRef.current)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [open, trainingContractId, reset, defaultValues])

  const onSubmit: SubmitHandler<FormValues> = async data => {
    if (!trainingContractId) {
      toast.error(t('No contract selected') || 'No hay contrato seleccionado')

      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('document_additional_clause', data.document_additional_clause ?? '')

      const res = await additionalClauseTrainingContract(trainingContractId, fd)

      if (res?.status === 200) {
        toast.success(t('Saved') || 'Texto Guardado!')

        // ✅ refrescar contrato en redux si viene
        const updated = res?.data?.training_contract
        if (updated) {
          dispatch(trainingContractActions.replaceTrainingContract(updated))
          dispatch(trainingContractActions.setModalStatus('info'))
        } else {
          // si no viene contrato, al menos consolidamos el valor local
          setValue('document_additional_clause', data.document_additional_clause ?? '', { shouldDirty: false })
        }
      } else {
        toast.error(res?.data?.message ?? (t('Error saving') || 'Error guardando'))
      }
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
      toast.error(t('Error saving') || 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Fragment>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6' fontWeight={800}>
            {t('Additional clause') || 'Cláusula Adicional'}
          </Typography>
        </Box>

        <Grid container spacing={5}>
          <Grid item xs={12}>
            <Controller
              name='document_additional_clause'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={12}
                  label={t('Additional clause') || 'Cláusula Adicional'}
                  {...field}
                  disabled={disabledAll}
                  error={Boolean(errors.document_additional_clause)}
                  helperText={(errors.document_additional_clause as any)?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Button variant='contained' type='submit' disabled={saving || loading || !trainingContractId}>
            <Icon icon='tabler:device-floppy' fontSize={20} />
            {t('Save') || 'Guardar'}
          </Button>
        </Box>
      </form>

      {!saving && loading && <SavingDialog labelKey='Processing Data' />}

      {saving && <SavingDialog />}
    </Fragment>
  )
}

export default TrainingContractAdditionalClauseTab
