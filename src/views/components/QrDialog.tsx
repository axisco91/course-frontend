// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'
import { Dialog, DialogActions, DialogContent, Fade, FadeProps } from '@mui/material'
import 'react-datepicker/dist/react-datepicker.css'

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

interface QrDialogProps {
  title: string
  qr: string
  secret: string
  onClose: () => void
}

const QrDialog: React.FC<QrDialogProps> = ({ title, qr, secret, onClose }) => {
  // Para el idioma
  const { t } = useTranslation()

  const handleCloseDialog = () => {
    onClose()
  }

  return (
    <Fragment>
      <Dialog
        fullWidth
        open={true}
        maxWidth='md'
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
              {title}
            </Typography>
            <Typography variant='body2' sx={{ mb: 2, color: 'text.secondary' }}>
              {t('Scan this QR code with your Authenticator app or enter the secret manually.')}
            </Typography>
            <img src={`data:image/svg+xml;utf8,${encodeURIComponent(qr)}`} alt='QR Code' />

            <Typography variant='body2' sx={{ mb: 3 }}>
              {t('Secret Key')}: <strong>{secret}</strong>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Button variant='contained' type='submit' sx={{ mr: 4 }} onClick={handleCloseDialog}>
            <Icon icon='tabler:device-floppy' fontSize={20} />
            {t('Continue')}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default QrDialog
