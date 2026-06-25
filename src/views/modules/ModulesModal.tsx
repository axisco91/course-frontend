import React, { ReactElement, Ref, forwardRef, useCallback, useEffect, useState } from 'react'
import { Box, Dialog, DialogContent, Fade, IconButton, Tab, Tabs, Typography } from '@mui/material'
import type { FadeProps } from '@mui/material/Fade'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { RootState } from 'src/reducers/types/types'
import ModulesGeneralTab from './ModulesGeneralTab'
import ModulesUnitsTab from './ModulesUnitsTab'

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

interface ModulesModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  moduleId?: number | null
}

const ModulesModal: React.FC<ModulesModalProps> = ({ open, onClose, mode, moduleId = null }) => {
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const moduleName = useSelector((state: RootState) => state.module.name)

  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.management')

  const [tab, setTab] = useState(0)
  const [modeUi, setModeUi] = useState<Mode>(mode)
  const [title, setTitle] = useState('')

  const isCreate = mode === 'create'
  const hasId = Boolean(moduleId)
  const unitsEnabled = !isCreate && hasId

  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  useEffect(() => {
    if (!open) return
    setTab(0)
    setTitle('')
  }, [open, moduleId])

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
    if (!unitsEnabled && tab === 1) setTab(0)
  }, [open, unitsEnabled, tab])

  const handleLoaded = useCallback((moduleData: any) => {
    const label = moduleData?.name ?? ''
    setTitle(String(label ?? '').trim())
  }, [])

  const getTitle = () => {
    if (!moduleId || isCreate) return 'Crear Módulo'
    if (effectiveMode === 'edit') return 'Editar Módulo'
    if (effectiveMode === 'view') return title || moduleName || 'Detalles del Módulo'

    return 'Módulo'
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
          {unitsEnabled && <Tab label='Unidades Formativas' />}
        </Tabs>

        <TabPanel value={tab} index={0}>
          <ModulesGeneralTab
            open={open}
            mode={effectiveMode}
            moduleId={moduleId ?? null}
            onClose={onClose}
            onLoaded={handleLoaded}
            onModeChange={nextMode => setModeUi(nextMode)}
          />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {open && unitsEnabled && tab === 1 && (
            <ModulesUnitsTab open={open} moduleId={moduleId ?? null} readOnly={effectiveMode === 'view'} />
          )}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default ModulesModal
