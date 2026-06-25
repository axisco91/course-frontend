import { useContext, useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { Box, Button, Grid, Typography } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from 'src/views/components/SavingDialog'
import { useTranslation } from 'react-i18next'

import { getUserCommissionTypes, updateUserCommissionType } from 'src/api/api'

const UsersCommissionPercentagesTab = ({ open, userId, readOnly = false }) => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const [types, setTypes] = useState([])
  const [valuesByName, setValuesByName] = useState({}) // ✅ { [typeName]: '10' }
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // ✅ cargar tipos + porcentajes
  useEffect(() => {
    if (!open || !userId) return

    let cancelled = false

    ;(async () => {
      setLoading(true)
      try {
        const res = await getUserCommissionTypes(userId)

        // 🔧 ajusta payload si hace falta
        const list =
          res.data?.data?.commission_types ??
          res.data?.data?.types ??
          res.data?.data?.userCommissionTypes ??
          res.data?.data ??
          res.data ??
          []

        const arr = Array.isArray(list) ? list : []
        if (cancelled) return

        setTypes(arr)

        // ✅ inicial: clave = name (IGUAL que el antiguo)
        const initial = {}
        arr.forEach(t => {
          const name = String(t?.name ?? t?.label ?? '').trim()
          if (!name) return
          initial[name] = String(t?.user_commission_types_percentage ?? t?.percentage ?? '')
        })

        setValuesByName(initial)
      } catch (e) {
        if (!cancelled) handleErrorRef.current(e, logoutRef.current)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, userId])

  const disabled = readOnly || loading || saving || !userId

  const onChange = (name, v) => {
    setValuesByName(prev => ({ ...prev, [name]: v }))
  }

  const save = async () => {
    if (!userId || readOnly) return

    setSaving(true)
    try {
      // ✅ reconstruimos percentajes SOLO con los names que vienen del backend
      // (evita mandar basura si el usuario tocó algo raro)
      const percentages = {}
      ;(types ?? []).forEach(t => {
        const name = String(t?.name ?? t?.label ?? '').trim()
        if (!name) return
        percentages[name] = valuesByName[name] ?? ''
      })

      const formData = new FormData()
      formData.append('user_id', String(userId))
      formData.append('percentages', JSON.stringify(percentages))

      const res = await updateUserCommissionType(formData)
      if (res?.status !== 200) {
        toast.error(res?.data?.message ?? t('No se pudo guardar'))

        return
      }

      toast.success(t('Percentages saved'))
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setSaving(false)
    }
  }

  const gridItems = useMemo(() => {
    return (types ?? []).map(t => {
      const id = Number(t?.id ?? t?.value ?? 0)
      const name = String(t?.name ?? t?.label ?? '').trim()
      if (!name) return null

      return (
        <Grid item xs={12} md={6} key={id || name}>
          <CustomTextField
            fullWidth
            label={name}
            value={valuesByName[name] ?? ''}
            onChange={e => onChange(name, e.target.value)}
            disabled={disabled}
          />
        </Grid>
      )
    })
  }, [types, valuesByName, disabled])

  return (
    <Fragment>
      <Box sx={{ mb: 4 }}>
        <Typography variant='h6'>{t('Porcentaje Comisiones')}</Typography>
      </Box>

      <Grid container spacing={5}>
        {gridItems}
      </Grid>

      {!readOnly && (
        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Button variant='contained' onClick={save} disabled={disabled}>
            <Icon icon='tabler:device-floppy' fontSize={20} />
            {t('Save')}
          </Button>
        </Box>
      )}

      {!saving && loading && <SavingDialog labelKey='Processing Data' />}

      {saving && <SavingDialog />}
    </Fragment>
  )
}

export default UsersCommissionPercentagesTab
