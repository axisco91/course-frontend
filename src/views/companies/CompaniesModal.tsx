import React, { Fragment, ReactElement, Ref, forwardRef, useCallback, useEffect, useState } from 'react'
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
import CompaniesGeneralTab from './CompaniesGeneralTab'
import CompanyWorkersTable from './CompanyWorkersTable'
import CompanyCoursesTable from './CompanyCoursesTable'
import CompanyObservationsTable from './CompanyObservationsTable'
import CompanyObservationsDelete from './CompanyObservationDelete'
import CompanyIncidenceDelete from './CompanyIncidenceDelete'
import CompanyIncidenceTable from './CompanyIncidenceTable'
import CompanyCreditsTable from './CompanyCreditTable'
import CompanyCreditDelete from './CompanyCreditDelete'

//import CompaniesHistoricalTab from './CompaniesHistoricalTab'
//import CompaniesCreditsTab from './CompaniesCreditsTab'

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

interface CompaniesModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  companyId?: number | null
}

const CompaniesModal: React.FC<CompaniesModalProps> = ({ open, onClose, mode, companyId = null }) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [companyName, setCompanyName] = useState('')

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.companies')

  const [modeUi, setModeUi] = useState<Mode>(mode)

  const isCreate = mode === 'create'
  const hasId = Boolean(companyId)

  // ✅ tabs enabled only when not create and has companyId
  const extraTabsEnabled = !isCreate && hasId

  // reset tab + title when opening or changing company
  useEffect(() => {
    if (!open) return
    setTab(0)
    setCompanyName('')
  }, [open, companyId])

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

  // if tab > 0 but not enabled, go back to general
  useEffect(() => {
    if (!open) return
    if (!extraTabsEnabled && tab !== 0) setTab(0)
  }, [open, extraTabsEnabled, tab])

  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  const handleLoaded = useCallback((c: any) => {
    // title
    setCompanyName(`${c?.name ?? ''}`.trim())
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
            {isCreate ? t('New Company') : companyName || t('Company')}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('General')} />
          <Tab label={t('Workers')} disabled={!extraTabsEnabled} />
          <Tab label={t('Courses')} disabled={!extraTabsEnabled} />
          <Tab label={t('Observations')} disabled={!extraTabsEnabled} />
          <Tab label={t('Historical')} disabled={!extraTabsEnabled} />
          <Tab label={t('Credits')} disabled={!extraTabsEnabled} />
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
          <CompaniesGeneralTab
            open={open}
            mode={effectiveMode}
            companyId={companyId ?? null}
            onClose={onClose}
            onLoaded={handleLoaded}
          />
        </TabPanel>

        {/* 1 - Workers */}
        <TabPanel value={tab} index={1}>
          {open && extraTabsEnabled && tab === 1 && <CompanyWorkersTable open={open} companyId={companyId!} />}
        </TabPanel>

        {/* 2 - Courses */}
        <TabPanel value={tab} index={2}>
          {open && extraTabsEnabled && tab === 2 && <CompanyCoursesTable open={open} companyId={companyId!} />}
        </TabPanel>

        {/* 3 - Observations */}
        <TabPanel value={tab} index={3}>
          {open && extraTabsEnabled && tab === 3 && (
            <Fragment>
              <CompanyObservationsTable open={open} companyId={companyId!} />
              <CompanyObservationsDelete />
            </Fragment>
          )}
        </TabPanel>

        {/* 4 - Historical */}
        <TabPanel value={tab} index={4}>
          {open && extraTabsEnabled && tab === 4 && (
            <Fragment>
              <CompanyIncidenceTable open={open} companyId={companyId!} />
              <CompanyIncidenceDelete />
            </Fragment>
          )}
        </TabPanel>

        {/* 5 - Credits */}
        <TabPanel value={tab} index={5}>
          {open && extraTabsEnabled && tab === 5 && (
            <Fragment>
              <CompanyCreditsTable open={open} companyId={companyId!} />
              <CompanyCreditDelete />
            </Fragment>
          )}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default CompaniesModal
