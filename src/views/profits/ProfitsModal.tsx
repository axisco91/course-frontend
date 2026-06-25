// ProfitsModal.tsx
import React, { ReactElement, Ref, forwardRef, useCallback, useEffect, useState } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  Fade,
  IconButton,
  Tab,
  Tabs,
  Typography,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import type { FadeProps } from '@mui/material/Fade'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useTranslation } from 'react-i18next'

// ✅ Usa tus componentes reales de Profits
import ProfitsGeneralTab from './ProfitsGeneralTab'
import ProfitsStudentsTable from './ProfitsStudentsTable'

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

interface ProfitsModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  profitId?: number | null
}

const ProfitsModal: React.FC<ProfitsModalProps> = ({ open, onClose, mode, profitId = null }) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [profitName, setProfitName] = useState('')

  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.profits')

  const [modeUi, setModeUi] = useState<Mode>(mode)

  const isCreate = mode === 'create'
  const hasId = Boolean(profitId)
  const studentsEnabled = !isCreate && hasId

  // reset tab + name when opening or changing
  useEffect(() => {
    if (!open) return
    setTab(0)
    setProfitName('')
  }, [open, profitId])

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

  // si tab Students no disponible, fuerza tab General
  useEffect(() => {
    if (!open) return
    if (!studentsEnabled && tab === 1) setTab(0)
  }, [open, studentsEnabled, tab])

  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  const handleLoaded = useCallback((p: any) => {
    // ✅ Profit title (ajusta el campo a tu modelo real)
    setProfitName(`${p?.name ?? p?.title ?? ''}`.trim())
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
            {isCreate ? t('New Profit') : profitName || t('Profit')}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('General')} />
          <Tab label={t('Students')} disabled={!studentsEnabled} />
        </Tabs>

        {tab === 0 && !isCreate && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              exclusive
              size='small'
              value={effectiveMode === 'edit' ? 'edit' : 'view'}
              onChange={(_, val) => {
                if (!val) return
                setModeUi(val as Mode)
              }}
              disabled={!canUpdate}
            >
              <ToggleButton value='view'>{t('Only see')}</ToggleButton>
              <ToggleButton value='edit'>{t('Edit')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        <TabPanel value={tab} index={0}>
          <ProfitsGeneralTab
            open={open}
            mode={effectiveMode}
            profitId={profitId}
            onClose={onClose}
            onLoaded={handleLoaded}
          />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {open && studentsEnabled && tab === 1 && <ProfitsStudentsTable open={open} profitId={profitId} />}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default ProfitsModal
