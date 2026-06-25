import React, { ReactElement, Ref, forwardRef, useCallback, useEffect, useState } from 'react'
import { Box, Dialog, DialogContent, Fade, IconButton, Typography } from '@mui/material'
import type { FadeProps } from '@mui/material/Fade'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useTranslation } from 'react-i18next'
import PotentialStudentsGeneralTab from './PotentialStudentsGeneralTab'

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

interface PotentialStudentsModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  potentialStudentId?: number | null
}

const PotentialStudentsModal: React.FC<PotentialStudentsModalProps> = ({ open, onClose, mode, potentialStudentId = null }) => {
  const { t } = useTranslation()
  const [studentName, setStudentName] = useState('')
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.potential_students')
  const hasPotentialStudentId = Boolean(potentialStudentId)
  const isCreate = mode === 'create' && !hasPotentialStudentId
  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? 'edit' : 'view'

  useEffect(() => {
    if (!open) return
    setStudentName('')
  }, [open, potentialStudentId])

  const handleLoadedStudent = useCallback((student: any) => {
    const firstName = student?.name ?? student?.first_name ?? student?.firstname ?? ''
    const lastName = student?.surname ?? student?.last_name ?? student?.lastname ?? ''
    setStudentName(`${firstName} ${lastName}`.trim())
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
            {isCreate ? t('New Potential Student') : studentName || t('Potential Student')}
          </Typography>
        </Box>

        <PotentialStudentsGeneralTab
          open={open}
          mode={effectiveMode}
          potentialStudentId={potentialStudentId ?? null}
          onClose={onClose}
          onLoadedStudent={handleLoadedStudent}
        />
      </DialogContent>
    </Dialog>
  )
}

export default PotentialStudentsModal
