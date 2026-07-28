// LiquidationsGeneralTab.tsx
import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, Grid, IconButton, Typography } from '@mui/material'
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
import { createWebPlatform, editWebPlatform, getMoodlePlatformDiagnostics, getWebPlatform } from 'src/api/api'

// ✅ reducer
import { webPlatformActions } from 'src/reducers/trainingActions/WebPlatformReducer'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    name: yup.string().nullable().required(t('Name is required'))
  })

type FormValues = {
  name: string
  url: string
  token: string
}

interface WebPlatformsGeneralTabProps {
  open: boolean
  mode: Mode
  webPlatformId: number | null
  onLoaded?: (liquidation: any) => void
  onClose?: () => void
}

const WebPlatformsGeneralTab: React.FC<WebPlatformsGeneralTabProps> = ({
  open,
  mode,
  webPlatformId,
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
  const [checking, setChecking] = useState(false)
  const [tokenConfigured, setTokenConfigured] = useState(false)
  const [requiredMoodleUsernames, setRequiredMoodleUsernames] = useState<string[]>([])
  const [requiredMoodleRoleShortnames, setRequiredMoodleRoleShortnames] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<{
    type: 'idle' | 'success' | 'error'
    message?: string
  }>({ type: 'idle' })

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      url: '',
      token: ''
    }),
    []
  )

  const {
    reset,
    control,
    handleSubmit,
    watch
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
      setTokenConfigured(false)
      setRequiredMoodleUsernames([])
      setRequiredMoodleRoleShortnames([])
      setConnectionStatus({ type: 'idle' })
      setLoading(false)

      return
    }

    if (!webPlatformId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getWebPlatform(webPlatformId)
        if (cancelled) return

        const l = res.data?.data?.web_platform ?? null
        if (!l) throw new Error('Web platform payload not found')

        onLoaded?.(l)

        reset({
          name: l.name ?? '',
          url: l.url ?? '',
          token: l.token ?? ''
        })
        setTokenConfigured(Boolean(l.token_configured))
        const usernames = Array.isArray(l.required_moodle_usernames) ? l.required_moodle_usernames : []
        setRequiredMoodleUsernames(usernames)
        setRequiredMoodleRoleShortnames(
          usernames.map((username: string) => l.required_moodle_roles?.[username] ?? '')
        )
        setConnectionStatus({ type: 'idle' })
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
  }, [open, mode, webPlatformId])

  // ----------------------------
  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return

    const usernames = requiredMoodleUsernames.map(username => username.trim())
    if (usernames.some(username => !username)) {
      toast.error('Los usernames Moodle obligatorios no pueden estar vacíos.')

      return
    }
    if (new Set(usernames.map(username => username.toLowerCase())).size !== usernames.length) {
      toast.error('Los usernames Moodle obligatorios no pueden estar duplicados.')

      return
    }
    const roleShortnames = requiredMoodleRoleShortnames.map(role => role.trim())
    if (roleShortnames.length !== usernames.length || roleShortnames.some(role => !role)) {
      toast.error('Cada usuario Moodle obligatorio debe tener un rol.')

      return
    }

    setSaving(true)

    try {
      const formData = new FormData()

      // ✅ editables
      formData.append('name', data.name ?? '')
      formData.append('url', data.url ?? '')
      formData.append('token', data.token ?? '')
      usernames.forEach(username => formData.append('required_moodle_usernames[]', username))
      roleShortnames.forEach(role => formData.append('required_moodle_role_shortnames[]', role))

      if (mode === 'create') {
        const response = await createWebPlatform(formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())

          const newId = response.data?.data?.web_platform?.id ?? response.data?.data?.id
          if (newId) {
            if (webPlatformActions?.setId) dispatch(webPlatformActions.setId(Number(newId)))
            if (webPlatformActions?.openModal) {
              dispatch(webPlatformActions.openModal({ mode: 'edit', webPlatformId: Number(newId) }))
            }
          }
        }
      } else if (mode === 'edit' && webPlatformId) {
        const response = await editWebPlatform(webPlatformId, formData)
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

  const checkMoodle = async () => {
    if (!webPlatformId) return
    setChecking(true)
    try {
      const response = await getMoodlePlatformDiagnostics(webPlatformId)
      const diagnostics = response.data?.data ?? {}
      if (!diagnostics.compatible) throw new Error(`Versión Moodle no compatible: ${diagnostics.release ?? '-'}`)
      const message = `Moodle ${diagnostics.release} conectado. Conector ${diagnostics.connectorversion || '-'}`
      setConnectionStatus({ type: 'success', message })
      toast.success(message)
    } catch (error) {
      const responseMessage = (error as any)?.response?.data?.message
      setConnectionStatus({
        type: 'error',
        message: responseMessage || (error as Error)?.message || 'No se ha podido verificar la conexión.'
      })
      handleError(error, logout)
    } finally {
      setChecking(false)
    }
  }

  const currentUrl = watch('url')
  const currentToken = watch('token')
  const hasUrl = Boolean(currentUrl?.trim())
  const hasToken = tokenConfigured || Boolean(currentToken?.trim())

  return (
    <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={4}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Name')} {...field} />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              name='url'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('URL')} {...field} />}
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <Controller
              name='token'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Token')} {...field} />}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              Usuarios obligatorios en cursos Moodle
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Estas cuentas deben existir en Moodle y se matricularán con el rol indicado en los cursos nuevos.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {requiredMoodleUsernames.map((username, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CustomTextField
                    fullWidth
                    label={`Username Moodle ${index + 1}`}
                    value={username}
                    disabled={readOnly}
                    onChange={event => {
                      const next = [...requiredMoodleUsernames]
                      next[index] = event.target.value
                      setRequiredMoodleUsernames(next)
                    }}
                  />
                  <CustomTextField
                    fullWidth
                    label={`Shortname del rol ${index + 1}`}
                    value={requiredMoodleRoleShortnames[index] ?? ''}
                    disabled={readOnly}
                    onChange={event => {
                      const next = [...requiredMoodleRoleShortnames]
                      next[index] = event.target.value
                      setRequiredMoodleRoleShortnames(next)
                    }}
                  />
                  {!readOnly ? (
                    <IconButton
                      color='error'
                      aria-label={`Eliminar username Moodle ${index + 1}`}
                      onClick={() => {
                        setRequiredMoodleUsernames(current => current.filter((_, currentIndex) => currentIndex !== index))
                        setRequiredMoodleRoleShortnames(current =>
                          current.filter((_, currentIndex) => currentIndex !== index)
                        )
                      }}
                    >
                      <Icon icon='tabler:trash' fontSize={20} />
                    </IconButton>
                  ) : null}
                </Box>
              ))}
              {!readOnly ? (
                <Button
                  variant='tonal'
                  color='secondary'
                  startIcon={<Icon icon='tabler:plus' fontSize={20} />}
                  onClick={() => {
                    setRequiredMoodleUsernames(current => [...current, ''])
                    setRequiredMoodleRoleShortnames(current => [...current, ''])
                  }}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Añadir usuario Moodle
                </Button>
              ) : null}
            </Box>
          </Grid>
        </Grid>

        {mode === 'edit' && webPlatformId ? (
          <Alert
            severity={connectionStatus.type === 'success' ? 'success' : connectionStatus.type === 'error' ? 'error' : 'info'}
            sx={{ mt: 5 }}
          >
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 2 }}>
              Requisitos para conectar con Zona
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Chip size='small' color={hasUrl ? 'success' : 'warning'} label={hasUrl ? 'URL configurada' : 'Falta URL'} />
              <Chip size='small' color={hasToken ? 'success' : 'warning'} label={hasToken ? 'Token configurado' : 'Falta token'} />
              <Chip
                size='small'
                color={connectionStatus.type === 'success' ? 'success' : connectionStatus.type === 'error' ? 'error' : 'default'}
                label={connectionStatus.type === 'success' ? 'Conector verificado' : connectionStatus.type === 'error' ? 'Conector pendiente' : 'Conector sin verificar'}
              />
            </Box>
            <Typography variant='body2' sx={{ mt: 2 }}>
              {connectionStatus.message || 'Guarda los datos y pulsa “Probar conexión Moodle” para comprobar el plugin, la versión y los permisos del token.'}
            </Typography>
          </Alert>
        ) : null}

        {mode !== 'view' && (
          <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', gap: 3 }}>
            {mode === 'edit' && webPlatformId ? (
              <Button variant='tonal' color='info' onClick={checkMoodle} disabled={saving || checking}>
                <Icon icon='tabler:plug-connected' fontSize={20} />
                {checking ? 'Comprobando...' : 'Probar conexión Moodle'}
              </Button>
            ) : null}
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

export default WebPlatformsGeneralTab
