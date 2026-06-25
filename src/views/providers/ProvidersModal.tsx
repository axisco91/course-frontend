import React, { ReactElement, Ref, forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Dialog, DialogContent, Fade, IconButton, Tab, Tabs, Typography } from '@mui/material'
import type { FadeProps } from '@mui/material/Fade'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import Icon from 'src/@core/components/icon'
import { RootState } from 'src/reducers/types/types'
import ProviderTrainingActionsTab from './ProviderTrainingActionsTab'
import ProvidersGeneralTab from './ProvidersGeneralTab'

type Mode = 'view' | 'edit' | 'create'

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
  '&:hover': {
    transform: 'translate(7px, -5px)'
  }
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

interface ProviderModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  providerId?: number | null
}

const ProvidersModal: React.FC<ProviderModalProps> = ({ open, onClose, mode, providerId = null }) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [title, setTitle] = useState('')

  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.management')

  const isCreate = mode === 'create'
  const hasId = Boolean(providerId)
  const trainingActionsEnabled = !isCreate && hasId
  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? mode : 'view'

  useEffect(() => {
    if (!open) return
    setTab(0)
    setTitle('')
  }, [open, providerId])

  useEffect(() => {
    if (!open) return
    if (!trainingActionsEnabled && tab === 1) {
      setTab(0)
    }
  }, [open, tab, trainingActionsEnabled])

  const handleLoaded = useCallback((provider: any) => {
    const providerName = provider?.name ?? ''
    setTitle(String(providerName).trim())
  }, [])

  const modalTitle = useMemo(() => {
    if (isCreate) return t('Create provider')
    if (effectiveMode === 'edit') return t('Edit provider')

    return title || t('Provider details')
  }, [effectiveMode, isCreate, t, title])

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
            {modalTitle}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('General')} />
          <Tab label={t('Training Actions')} disabled={!trainingActionsEnabled} />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <ProvidersGeneralTab
            open={open}
            mode={effectiveMode}
            providerId={providerId ?? null}
            onClose={onClose}
            onLoaded={handleLoaded}
          />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {open && trainingActionsEnabled && tab === 1 && (
            <ProviderTrainingActionsTab open={open} providerId={providerId ?? null} />
          )}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default ProvidersModal
