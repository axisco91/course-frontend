import React, { Fragment, useContext, useEffect, useRef, useState } from 'react'
import { Box, Button, Grid, Typography } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from 'src/views/components/SavingDialog'
import { useTranslation } from 'react-i18next'

// 🔧 Ajusta a tu api real
import { changeUserPassword } from 'src/api/api'

type FormValues = { password: string }

const schema = (t: (k: string) => string) =>
  yup.object().shape({
    password: yup.string().trim().min(6, t('Mínimo 6')).required(t('Contraseña requerida'))
  })

const UsersChangePasswordTab = ({ open, userId }: { open: boolean; userId: number | null }) => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const [saving, setSaving] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: { password: '' },
    resolver: yupResolver(schema(t))
  })

  useEffect(() => {
    if (!open) return
    reset({ password: '' })
  }, [open, reset, userId])

  const onSubmit: SubmitHandler<FormValues> = async data => {
    if (!userId) return toast.error(t('User unavailable'))
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('password', data.password)
      const res = await changeUserPassword(userId, formData)
      if (res?.status !== 200) {
        toast.error(res?.data?.message ?? t('Password could not be changed'))

        return
      }
      toast.success(t('Password saved'))
      reset({ password: '' })
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Fragment>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography variant='h6'>{t('Cambiar Contraseña')}</Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={5} justifyContent='center'>
          <Grid item xs={12} md={6}>
            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Password')}
                  placeholder={t('Password')}
                  type='password'
                  {...field}
                  disabled={saving}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
          <Button variant='contained' type='submit' disabled={saving}>
            {t('Save')}
          </Button>
        </Box>
      </form>

      {saving && <SavingDialog />}
    </Fragment>
  )
}

export default UsersChangePasswordTab
