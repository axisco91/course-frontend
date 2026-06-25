// src/views/users/UsersModal.tsx
import React, { ReactElement, Ref, forwardRef, useCallback, useEffect, useState } from 'react'
import { Box, Dialog, DialogContent, Fade, IconButton, Tab, Tabs, Typography } from '@mui/material'
import type { FadeProps } from '@mui/material/Fade'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useTranslation } from 'react-i18next'

import UsersGeneralTab from './UsersGeneralTab'
import UsersCommissionsTab from './UsersCommissionsTab'
import UsersChangePasswordTab from './UsersChangePassword'
import UsersCommissionPercentagesTab from './UsersCommissionsPercentages'

type Mode = 'view' | 'edit' | 'create'

// Transition
const Transition = forwardRef(function Transition(props: FadeProps & { children: ReactElement }, ref: Ref<unknown>) {
  return <Fade ref={ref} {...props} />
})

const CustomCloseButton = styled(IconButton)(({ theme }) => ({
  top: 0,
  right: 0,
  color: 'grey.500',
  position: 'absolute',
  boxShadow: theme.shadows[2],
  transform: 'translate(10px, -10px)',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: `${theme.palette.background.paper} !important`,
  transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
  '&:hover': { transform: 'translate(7px, -5px)' }
}))

type TabPanelProps = {
  value: number
  index: number
  children: React.ReactNode
}

function TabPanel({ value, index, children }: TabPanelProps) {
  if (value !== index) return null

  return <Box sx={{ pt: 4 }}>{children}</Box>
}

interface UsersModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  userId?: number | null
}

const UsersModal: React.FC<UsersModalProps> = ({ open, onClose, mode, userId = null }) => {
  const { t } = useTranslation()

  const [tab, setTab] = useState(0)
  const [title, setTitle] = useState('')

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.users')

  const [modeUi, setModeUi] = useState<Mode>(mode)

  const isCreate = mode === 'create'
  const hasId = Boolean(userId)

  // ✅ tabs extra SOLO si no es create y hay id
  const changePasswordEnabled = !isCreate && hasId
  const commissionsEnabled = !isCreate && hasId
  const percentagesEnabled = !isCreate && hasId

  // reset tab + title al abrir / cambiar usuario
  useEffect(() => {
    if (!open) return
    setTab(0)
    setTitle('')
  }, [open, userId])

  // sync mode (respeta permisos)
  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      setModeUi('create')

      return
    }

    if (!canUpdate) {
      setModeUi('view')

      return
    }

    setModeUi(mode)
  }, [open, mode, canUpdate])

  // si tab no disponible, fuerza General
  useEffect(() => {
    if (!open) return
    if (!changePasswordEnabled && tab === 1) setTab(0)
    if (!commissionsEnabled && tab === 2) setTab(0)
    if (!percentagesEnabled && tab === 3) setTab(0)
  }, [open, tab, changePasswordEnabled, commissionsEnabled, percentagesEnabled])

  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  // titulo base
  useEffect(() => {
    if (!open) return
    if (isCreate) {
      setTitle(t('Crear Usuario'))

      return
    }
    setTitle(t('Usuario'))
  }, [open, isCreate, t])

  // llamado por GeneralTab cuando carga datos
  const handleLoaded = useCallback((u: any) => {
    const n = `${u?.name ?? ''} ${u?.surname ?? ''}`.trim()
    if (n) setTitle(n)
  }, [])

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth='lg'
      scroll='body'
      onClose={onClose}
      TransitionComponent={Transition}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <CustomCloseButton onClick={onClose}>
        <Icon icon='tabler:x' fontSize={18} />
      </CustomCloseButton>

      <DialogContent sx={{ pt: 6 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography variant='h5' sx={{ fontWeight: 700 }}>
            {isCreate ? t('Crear Usuario') : title || t('Usuario')}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('General')} />
          <Tab label={t('Cambiar Contraseña')} disabled={!changePasswordEnabled} />
          <Tab label={t('Comisiones')} disabled={!commissionsEnabled} />
          <Tab label={t('Porcentaje Comisiones')} disabled={!percentagesEnabled} />
        </Tabs>

        {/* 0 - General */}
        <TabPanel value={tab} index={0}>
          <UsersGeneralTab open={open} mode={effectiveMode} userId={userId} onClose={onClose} onLoaded={handleLoaded} />
        </TabPanel>

        {/* 1 - Cambiar Contraseña */}
        <TabPanel value={tab} index={1}>
          {open && changePasswordEnabled && tab === 1 && <UsersChangePasswordTab open={open} userId={userId!} />}
        </TabPanel>

        {/* 2 - Comisiones */}
        <TabPanel value={tab} index={2}>
          {open && commissionsEnabled && tab === 2 && <UsersCommissionsTab open={open} userId={userId!} />}
        </TabPanel>

        {/* 3 - Porcentaje Comisiones */}
        <TabPanel value={tab} index={3}>
          {open && percentagesEnabled && tab === 3 && <UsersCommissionPercentagesTab open={open} userId={userId!} />}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default UsersModal
