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
import StudentsGeneralTab from './StudentsGeneralTab'
import StudentsCoursesTable from './StudentsCoursesTable'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useTranslation } from 'react-i18next'

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

interface StudentModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  studentId?: number | null
}

const StudentModal: React.FC<StudentModalProps> = ({ open, onClose, mode, studentId = null }) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [studentName, setStudentName] = useState('')

  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.students')

  const [modeUi, setModeUi] = useState<Mode>(mode)

  // ✅ si hay id, ya NO es create
  const hasStudentId = Boolean(studentId)
  const isCreate = mode === 'create' && !hasStudentId

  // ✅ courses solo si hay id
  const coursesEnabled = hasStudentId

  // ✅ modo efectivo para el GeneralTab
  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  // reset tab + name when opening or changing student
  useEffect(() => {
    if (!open) return
    setTab(0)
    setStudentName('')
  }, [open, studentId])

  // ✅ Sync modeUi con props, pero sin pisar cuando ya hay id
  useEffect(() => {
    if (!open) return

    // si ya hay id, ignoramos "create" del prop y respetamos permisos
    if (studentId) {
      if (!canUpdate) setModeUi('view')

      return
    }

    // si no hay id, aquí sí aceptamos create
    if (mode === 'create') {
      setModeUi('create')

      return
    }

    if (!canUpdate) {
      setModeUi('view')

      return
    }

    setModeUi(mode)
  }, [open, mode, canUpdate, studentId])

  // ✅ cuando aparece studentId tras crear, pasa de create -> edit/view
  useEffect(() => {
    if (!open) return
    if (studentId && modeUi === 'create') {
      setModeUi(canUpdate ? 'edit' : 'view')
    }
  }, [open, studentId, modeUi, canUpdate])

  // ✅ si Courses no está disponible, fuerza tab General
  useEffect(() => {
    if (!open) return
    if (!coursesEnabled && tab === 1) setTab(0)
  }, [open, coursesEnabled, tab])

  const handleLoadedStudent = useCallback((s: any) => {
    setStudentName(`${s?.name ?? ''} ${s?.surname ?? ''}`.trim())
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
            {isCreate ? t('Nuevo alumno') : studentName || t('Alumno')}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('General')} />
          <Tab label={t('Courses')} disabled={!coursesEnabled} />
        </Tabs>

        {/* ✅ Toggle SOLO en General y SOLO si NO es create */}
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
          <StudentsGeneralTab
            open={open}
            mode={effectiveMode}
            studentId={studentId ?? null}
            onClose={onClose}
            onLoadedStudent={handleLoadedStudent}
          />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {open && coursesEnabled && tab === 1 && <StudentsCoursesTable open={open} studentId={studentId} />}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default StudentModal
