import React, { ReactElement, Ref, forwardRef, useCallback, useEffect, useState } from 'react'
import { Box, Dialog, DialogContent, Fade, IconButton, Typography } from '@mui/material'
import type { FadeProps } from '@mui/material/Fade'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { RootState } from 'src/reducers/types/types'
import TrainingUnitsGeneralTab from './TrainingUnitsGeneralTab'

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

interface TrainingUnitsModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  trainingUnitId?: number | null
}

const TrainingUnitsModal: React.FC<TrainingUnitsModalProps> = ({ open, onClose, mode, trainingUnitId = null }) => {
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const trainingUnitName = useSelector((state: RootState) => state.trainingUnit.name)

  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.management')

  const [modeUi, setModeUi] = useState<Mode>(mode)
  const [title, setTitle] = useState('')

  const isCreate = mode === 'create'

  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  useEffect(() => {
    if (!open) return
    setTitle('')
  }, [open, trainingUnitId])

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

  const handleLoaded = useCallback((trainingUnitData: any) => {
    const label = trainingUnitData?.name ?? ''
    setTitle(String(label ?? '').trim())
  }, [])

  const getTitle = () => {
    if (!trainingUnitId || isCreate) return 'Crear Unidad Formativa'
    if (effectiveMode === 'edit') return 'Editar Unidad Formativa'
    if (effectiveMode === 'view') return title || trainingUnitName || 'Detalles de la Unidad Formativa'

    return 'Unidad Formativa'
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

        <Box sx={{ pt: 1 }}>
          <TrainingUnitsGeneralTab
            open={open}
            mode={effectiveMode}
            trainingUnitId={trainingUnitId ?? null}
            onClose={onClose}
            onLoaded={handleLoaded}
            onModeChange={nextMode => setModeUi(nextMode)}
          />
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default TrainingUnitsModal
