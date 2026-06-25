import React, { Fragment, ReactElement, Ref, forwardRef } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  Fade,
  FadeProps,
  IconButton,
  IconButtonProps,
  Typography,
  styled
} from '@mui/material'
import { useTranslation } from 'react-i18next'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// Para los dialogs
const Transition = forwardRef(function Transition(
  props: FadeProps & { children?: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Fade ref={ref} {...props} />
})

const CustomCloseButton = styled(IconButton)<IconButtonProps>(({ theme }) => ({
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

interface SaveProps {
  onClose: () => void
  capture: string
  title: string
}

const CaptureDialog: React.FC<SaveProps> = ({ onClose, capture, title }) => {
  const { t } = useTranslation()

  const handleCloseDialog = () => {
    onClose()
  }

  return (
    <Fragment>
      <Dialog
        fullWidth
        open={true}
        maxWidth='xl'
        scroll='body'
        onClose={handleCloseDialog}
        TransitionComponent={Transition}
        onBackdropClick={handleCloseDialog}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogContent
          sx={{
            pb: theme => `${theme.spacing(8)} !important`,
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <CustomCloseButton onClick={handleCloseDialog}>
            <Icon icon='tabler:x' fontSize='1.25rem' />
          </CustomCloseButton>
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant='h3' sx={{ mb: 3 }}>
              {t('Capture')}: {title}
            </Typography>
            <img src={capture} alt='File' style={{ maxWidth: '100%', maxHeight: '500px' }} />
          </Box>
        </DialogContent>
      </Dialog>
    </Fragment>
  )
}

export default CaptureDialog
