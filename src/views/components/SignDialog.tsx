// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef, useRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import { Button, Dialog, DialogActions, DialogContent, Fade, FadeProps, Grid } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'
import SignatureCanvas from 'react-signature-canvas'
import toast from 'react-hot-toast'

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

interface SignDialogProps {
  onClose: () => void
  onSave: (signature: string) => void
}

const SignDialog: React.FC<SignDialogProps> = ({ onClose, onSave }) => {
  // Para el idioma
  const { t } = useTranslation()
  const sigCanvas = useRef(null)

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear()
    }
  }

  const save = () => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        toast.error(t('Please provide a signature before saving'))

        return
      }

      const data = sigCanvas.current.toDataURL('image/png')

      onSave(data)
    }
  }
  const handleCloseDialog = () => {
    onClose()
  }

  return (
    <Fragment>
      <Dialog
        fullWidth
        open={true}
        maxWidth='sm'
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
              {t('Sign')}
            </Typography>
          </Box>
          <Grid container>
            <Grid item xs={12} sm={12}>
              <Box
                sx={{
                  border: '1px solid #ccc',
                  width: '300px',
                  height: '300px',
                  margin: 'auto'
                }}
              >
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor='black'
                  canvasProps={{
                    width: 300,
                    height: 300,
                    className: 'signature-canvas'
                  }}
                />
              </Box>

              <Box
                sx={{
                  marginTop: '5px'
                }}
              ></Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'right',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Button variant='contained' sx={{ mr: 2 }} color='primary' onClick={save}>
            <Icon icon='tabler:sign' fontSize='1.25rem' />
            {t('Sign')}
          </Button>
          <Button variant='contained' sx={{ mr: 2 }} color='secondary' onClick={clear}>
            <Icon icon='tabler:eraser' fontSize='1.25rem' />
            {t('Clear')}
          </Button>
          <Button variant='tonal' color='secondary' onClick={handleCloseDialog}>
            <Icon icon='tabler:x' fontSize='1.25rem' />
            {t('Cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default SignDialog
