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

// ✅ Tabs components (ajusta imports a tus archivos reales)
import AdvisorsGeneralTab from './AdvisorsGeneralTab'
import AdvisorsCompaniesTable from './AdvisorsCompaniesTable'

import AdvisorsCoursesTable from './AdvisorsCoursesTable'
import AdvisorsTrainingContractsTable from './AdvisorsTrainingContractsTable'
import AdvisorsCommissionsTable from './AdvisorsCommissionsTable'

// import AdvisorsObservationsTab from './AdvisorsObservationsTab'
// import AdvisorsCommissionPercentagesTab from './AdvisorsCommissionPercentagesTab'
// import AdvisorsHistoricalTab from './AdvisorsHistoricalTab'

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

interface AdvisorsModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  advisorId?: number | null
}

const AdvisorsModal: React.FC<AdvisorsModalProps> = ({ open, onClose, mode, advisorId = null }) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [title, setTitle] = useState('')

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.advisors')

  const [modeUi, setModeUi] = useState<Mode>(mode)

  const isCreate = mode === 'create'
  const hasId = Boolean(advisorId)

  // ✅ tabs enabled only when not create and has id
  const extraTabsEnabled = !isCreate && hasId

  // reset tab + title when opening/changing
  useEffect(() => {
    if (!open) return
    setTab(0)
    setTitle('')
  }, [open, advisorId])

  // sync mode with permissions
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

  // if tab > 0 but not enabled, go back
  useEffect(() => {
    if (!open) return
    if (!extraTabsEnabled && tab !== 0) setTab(0)
  }, [open, extraTabsEnabled, tab])

  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  const handleLoaded = useCallback((a: any) => {
    // ✅ modal title (ajusta si en advisor usas name/surname)
    const name =
      a?.name && a?.surname ? `${a.name} ${a.surname}`.trim() : (a?.name ?? a?.full_name ?? a?.fullName ?? '').trim()
    setTitle(name)
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
            {isCreate ? t('New Advisor') : title || t('Advisor')}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('General')} />
          <Tab label={t('Companies')} disabled={!extraTabsEnabled} />
          <Tab label={t('Courses')} disabled={!extraTabsEnabled} />
          <Tab label={t('Training Contracts')} disabled={!extraTabsEnabled} />
          <Tab label={t('Commission')} disabled={!extraTabsEnabled} />
          <Tab label={t('Historical')} disabled={!extraTabsEnabled} />
        </Tabs>

        {/* Toggle only in General and not create */}
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

        {/* 0 - General */}
        <TabPanel value={tab} index={0}>
          <AdvisorsGeneralTab
            open={open}
            mode={effectiveMode}
            advisorId={advisorId ?? null /* si tu GeneralTab es de Advisors, cambia props/nombre */}
            onClose={onClose}
            onLoaded={handleLoaded}
          />
        </TabPanel>

        {/* 1 - Companies */}
        <TabPanel value={tab} index={1}>
          {open && extraTabsEnabled && tab === 1 && <AdvisorsCompaniesTable open={open} advisorId={advisorId!} />}
        </TabPanel>

        {/* 2 - Courses */}
        <TabPanel value={tab} index={2}>
          {open && extraTabsEnabled && tab === 2 && <AdvisorsCoursesTable open={open} advisorId={advisorId!} />}
        </TabPanel>

        {/* 3 - Training Contracts */}
        <TabPanel value={tab} index={3}>
          {open && extraTabsEnabled && tab === 3 && (
            <AdvisorsTrainingContractsTable open={open} advisorId={advisorId!} />
          )}
        </TabPanel>

        {/* 4 - Commissions */}
        <TabPanel value={tab} index={4}>
          {open && extraTabsEnabled && tab === 4 && <AdvisorsCommissionsTable open={open} advisorId={advisorId!} />}
        </TabPanel>

        {/* 5 - Historical */}
        <TabPanel value={tab} index={5}>
          {open && extraTabsEnabled && tab === 5 && ''}
          {/* <AdvisorsHistoricalTab open={open} advisorId={advisorId!} /> */}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default AdvisorsModal
