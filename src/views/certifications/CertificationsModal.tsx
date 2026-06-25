import React, { ReactElement, Ref, forwardRef, useCallback, useEffect, useState } from 'react'
import { Box, Dialog, DialogContent, Fade, IconButton, Tab, Tabs, Typography } from '@mui/material'
import type { FadeProps } from '@mui/material/Fade'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { RootState } from 'src/reducers/types/types'
import CertificationsElementsTab from './CertificationsElementsTab'
import CertificationsGeneralTab from './CertificationsGeneralTab'

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

const TabPanel = ({ value, index, children }: TabPanelProps) => {
  if (value !== index) return null

  return <Box sx={{ pt: 4 }}>{children}</Box>
}

interface CertificationsModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  certificationId?: number | null
}

const CertificationsModal: React.FC<CertificationsModalProps> = ({ open, onClose, mode, certificationId = null }) => {
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const certificationName = useSelector((state: RootState) => state.certification.name)

  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.management')

  const [tab, setTab] = useState(0)
  const [modeUi, setModeUi] = useState<Mode>(mode)
  const [title, setTitle] = useState('')

  const isCreate = mode === 'create'
  const hasId = Boolean(certificationId)
  const elementsEnabled = !isCreate && hasId

  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  useEffect(() => {
    if (!open) return
    setTab(0)
    setTitle('')
  }, [open, certificationId])

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

  useEffect(() => {
    if (!open) return
    if (!elementsEnabled && tab === 1) setTab(0)
  }, [open, elementsEnabled, tab])

  const handleLoaded = useCallback((certification: any) => {
    const label = certification?.name ?? ''
    setTitle(String(label ?? '').trim())
  }, [])

  const getTitle = () => {
    if (isCreate) return 'Nueva Certificación'

    return title || certificationName || 'Certificación'
  }

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
            {getTitle()}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label='General' />
          <Tab label='Unidades / Módulos' disabled={!elementsEnabled} />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <CertificationsGeneralTab
            open={open}
            mode={effectiveMode}
            certificationId={certificationId ?? null}
            onClose={onClose}
            onLoaded={handleLoaded}
            onModeChange={nextMode => setModeUi(nextMode)}
          />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {open && elementsEnabled && tab === 1 && (
            <CertificationsElementsTab
              open={open}
              certificationId={certificationId ?? null}
              readOnly={effectiveMode === 'view'}
            />
          )}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default CertificationsModal
