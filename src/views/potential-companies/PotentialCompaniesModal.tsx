import React, { ReactElement, Ref, forwardRef } from 'react'
import { Box, Dialog, DialogContent, Fade, IconButton, Typography } from '@mui/material'
import type { FadeProps } from '@mui/material/Fade'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import PotentialCompaniesGeneralTab from './PontetialCompaniesGeneralTab'

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

interface PotentialCompaniesModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  potentialCompanyId?: number | null
}

const PotentialCompaniesModal: React.FC<PotentialCompaniesModalProps> = ({
  open,
  onClose,
  mode,
  potentialCompanyId = null
}) => {
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.potential_companies')
  const hasPotentialCompanyId = Boolean(potentialCompanyId)
  const isCreate = mode === 'create' && !hasPotentialCompanyId
  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? 'edit' : 'view'

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth='md'
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
            Empresa potencial
          </Typography>
        </Box>

        <PotentialCompaniesGeneralTab
          open={open}
          mode={effectiveMode}
          potentialCompanyId={potentialCompanyId ?? null}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

export default PotentialCompaniesModal
