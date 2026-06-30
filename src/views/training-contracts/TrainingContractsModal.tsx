import React, { ReactElement, Ref, forwardRef, useCallback, useContext, useEffect, useState } from 'react'
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

// ✅ AJUSTA imports a tus archivos reales
import TrainingContractsGeneralTab from './TrainingContractsGeneralTab'
import FormationTab from './FormationTab'
import ExcludedDaysTable from './ExcludedDayTable'
import FestivalsTab from './FestivalsTab'
import HistoricalTab from './HistoricalTab'
import BonificationTab from './BonificationTab'
import TrainingContractDocuments from './TrainingContractDocuments'
import TrainingContractAdditionalClauseTab from './TrainingContractAdditionalClause'
import { getTrainingContractCertifications, getTrainingContractSpecialties } from 'src/api/api'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'
import { useDispatch } from 'react-redux'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

//import TrainingContractsDocumentsTab from './TrainingContractsDocumentsTab'
//import TrainingContractsAdditionalTextClausesTab from './TrainingContractsAdditionalTextClausesTab'

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

interface TrainingContractsModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  trainingContractId?: number | null
}

const TrainingContractsModal: React.FC<TrainingContractsModalProps> = ({
  open,
  onClose,
  mode,
  trainingContractId = null
}) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [title, setTitle] = useState('')
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.training_contracts')

  const [modeUi, setModeUi] = useState<Mode>(mode)

  const isCreate = mode === 'create'
  const hasId = Boolean(trainingContractId)

  // ✅ tabs extra solo cuando no es create y hay id
  const extraTabsEnabled = !isCreate && hasId

  // reset tab + title when opening/changing entity
  useEffect(() => {
    if (!open) return
    setTab(0)
    setTitle('')
  }, [open, trainingContractId])

  // sync mode (respect permissions)
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
    if (!open || !trainingContractId) return

    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [specialtiesRes, certificationsRes] = await Promise.all([
          getTrainingContractSpecialties(trainingContractId, { show_inactive: 'false' }),
          getTrainingContractCertifications(trainingContractId, { show_inactive: 'false' })
        ])

        if (cancelled) return

        dispatch(trainingContractActions.setSpecialties(specialtiesRes.data.data.training_contract_specialties))
        dispatch(trainingContractActions.setCertifications(certificationsRes.data.data.certifications))
      } catch (error) {
        if (!cancelled) handleError(error, logout)
      } finally {
        if (!cancelled) return
      }
    }

    fetchGeneralData()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, trainingContractId])

  // if extra tabs not available, force General
  useEffect(() => {
    if (!open) return
    if (!extraTabsEnabled && tab !== 0) setTab(0)
  }, [open, extraTabsEnabled, tab])

  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  // called by GeneralTab when data loaded
  const handleLoaded = useCallback(
    (tc: any) => {
      // Ajusta el título según tu payload real
      // Ej: number, company_name, student_name...
      const num = tc?.number ?? tc?.contract_number ?? tc?.id
      const company = tc?.company_name ?? tc?.company?.name ?? ''
      const student =
        tc?.student_name ?? (tc?.student ? `${tc.student.name ?? ''} ${tc.student.surname ?? ''}`.trim() : '') ?? ''

      const label = [num ? `${t('Contract')} #${num}` : t('Contract'), company, student].filter(Boolean).join(' · ')
      setTitle(String(label ?? '').trim())
    },
    [t]
  )

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
            {isCreate ? t('New training contract') : title || t('Training contract')}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('General')} />
          <Tab label={t('Formation')} disabled={!extraTabsEnabled} />
          <Tab label={t('Excluded days')} disabled={!extraTabsEnabled} />
          <Tab label={t('Festivals')} disabled={!extraTabsEnabled} />
          <Tab label={t('Historical')} disabled={!extraTabsEnabled} />
          <Tab label={t('Bonifications')} disabled={!extraTabsEnabled} />
          <Tab label={t('Documents')} disabled={!extraTabsEnabled} />
          <Tab label={t('Additional text clauses')} disabled={!extraTabsEnabled} />
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
          <TrainingContractsGeneralTab
            open={open}
            mode={effectiveMode}
            trainingContractId={trainingContractId ?? null}
            onClose={onClose}
            onLoaded={handleLoaded}
          />
        </TabPanel>

        {/* 1 - Formation */}
        <TabPanel value={tab} index={1}>
          {open && extraTabsEnabled && tab === 1 && <FormationTab open={open} />}
        </TabPanel>

        {/* 2 - Excluded days */}
        <TabPanel value={tab} index={2}>
          {open && extraTabsEnabled && tab === 2 && <ExcludedDaysTable />}
        </TabPanel>

        {/* 3 - Festivals */}
        <TabPanel value={tab} index={3}>
          {open && extraTabsEnabled && tab === 3 && <FestivalsTab />}
        </TabPanel>

        {/* 4 - Historical */}
        <TabPanel value={tab} index={4}>
          {open && extraTabsEnabled && tab === 4 && <HistoricalTab />}
        </TabPanel>

        {/* 5 - Bonifications */}
        <TabPanel value={tab} index={5}>
          {open && extraTabsEnabled && tab === 5 && <BonificationTab open={open} />}
        </TabPanel>

        {/* 6 - Documents */}
        <TabPanel value={tab} index={6}>
          {open && extraTabsEnabled && tab === 6 && <TrainingContractDocuments open={open} />}
        </TabPanel>

        {/* 7 - Additional text clauses */}
        <TabPanel value={tab} index={7}>
          {open && extraTabsEnabled && tab === 7 && (
            <TrainingContractAdditionalClauseTab open={open} trainingContractId={trainingContractId!} />
          )}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default TrainingContractsModal
