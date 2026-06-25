import React, { ReactElement, Ref, forwardRef, useEffect, useState } from 'react'
import { Box, Dialog, DialogContent, Fade, IconButton, Tab, Tabs, Typography } from '@mui/material'
import type { FadeProps } from '@mui/material/Fade'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useTranslation } from 'react-i18next'
import IncidenceTypesGeneralTab from './IncidenceTypesGeneralTab'

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

interface IncidenceTypeModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  incidenceTypeId?: number | null
}

const IncidenceTypesModel: React.FC<IncidenceTypeModalProps> = ({ open, onClose, mode, incidenceTypeId = null }) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)

  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.management')

  const [modeUi, setModeUi] = useState<Mode>(mode)

  const isCreate = mode === 'create'

  // ✅ modo efectivo para el GeneralTab
  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  // reset tab + name when opening or changing course
  useEffect(() => {
    if (!open) return
    setTab(0)
  }, [open])

  // sync mode
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
            {isCreate ? t('New Incidence Type') : t('Incidence Type')}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('General')} />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <IncidenceTypesGeneralTab
            open={open}
            mode={effectiveMode}
            incidenceTypeId={incidenceTypeId ?? null}
            onClose={onClose}
          />
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default IncidenceTypesModel
