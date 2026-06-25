// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef, useState } from 'react'

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
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import CustomAvatar from 'src/@core/components/mui/avatar'
import { useDispatch } from 'react-redux'
import { companySignatureActions } from 'src/reducers/documents/CompanySignatureReducer'

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

interface CommentDialogProps {
  onClose: () => void
}

const SelectSignatureDialog: React.FC<CommentDialogProps> = ({ onClose }) => {
  // Para el idioma
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const companySignatures = useSelector((state: RootState) => state.companySignature.companySignatures)

  const handleCloseDialog = () => {
    onClose()
  }

  const handleSelect = signature => {
    dispatch(companySignatureActions.setSelectedSignature(signature))
    onClose()
  }

  // Obtenemos vista de las firmas
  const signatures = () => {
    return companySignatures.map(signature => (
      <CustomAvatar
        key={signature.id}
        src={signature.path}
        skin='light'
        variant='rounded'
        onClick={() => handleSelect(signature)}
        sx={{
          mr: 5,
          ml: 5,
          width: 150, // Fixed container width
          height: 100, // Fixed container height
          mb: 4,
          fontSize: '3rem',
          overflow: 'hidden', // Ensures no overflow from image

          // Ensures that the <img> inside adjusts to fit the container
          '& img': {
            width: '100%', // Image takes up full width of the container
            height: '100%', // Image takes up full height of the container
            objectFit: 'contain' // Scale the image to fit without cropping
          }
        }}
      />
    ))
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
              {t('Select Signature')}
            </Typography>
          </Box>
          <Grid container>
            <Grid item xs={12} sm={12}>
              <Box sx={{ display: 'flex', flexDirection: 'row' }}>{signatures()}</Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Button variant='tonal' color='secondary' onClick={handleCloseDialog}>
            {t('Cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default SelectSignatureDialog
