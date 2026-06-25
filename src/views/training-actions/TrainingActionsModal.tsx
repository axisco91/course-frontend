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
import TrainingActionsGeneralTab from './TrainingActionsGeneralTab'
import TrainingActionsCoursesTable from './TrainingActionsCoursesTable'

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

interface TrainingActionsModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  trainingActionId?: number | null
}

const TrainingActionsModal: React.FC<TrainingActionsModalProps> = ({
  open,
  onClose,
  mode,
  trainingActionId = null
}) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [title, setTitle] = useState('')

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.training_actions')

  const [modeUi, setModeUi] = useState<Mode>(mode)

  const isCreate = mode === 'create'
  const hasId = Boolean(trainingActionId)

  // ✅ Courses tab enabled only if not create and has id
  const coursesEnabled = !isCreate && hasId

  // reset tab + title when opening/changing entity
  useEffect(() => {
    if (!open) return
    setTab(0)
    setTitle('')
  }, [open, trainingActionId])

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

  // if Courses not available, force General
  useEffect(() => {
    if (!open) return
    if (!coursesEnabled && tab === 1) setTab(0)
  }, [open, coursesEnabled, tab])

  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  // called by GeneralTab when data loaded
  const handleLoaded = useCallback((ta: any) => {
    // usa el campo que tengas: name, formative_action, label...
    const label =
      ta?.name ?? ta?.formative_action ?? ta?.label ?? `${ta?.formative_action ?? ''} ${ta?.name ?? ''}`.trim()

    setTitle(String(label ?? '').trim())
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
            {isCreate ? t('New Training action') : title || t('Training action')}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('General')} />
          <Tab label={t('Courses')} disabled={!coursesEnabled} />
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
          <TrainingActionsGeneralTab
            open={open}
            mode={effectiveMode}
            trainingActionId={trainingActionId ?? null}
            onClose={onClose}
            onLoaded={handleLoaded}
          />
        </TabPanel>

        {/* 1 - Courses */}
        <TabPanel value={tab} index={1}>
          {open && coursesEnabled && tab === 1 && (
            <TrainingActionsCoursesTable open={open} trainingActionId={trainingActionId!} />
          )}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default TrainingActionsModal
