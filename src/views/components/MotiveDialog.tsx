// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import { Dialog, DialogActions, DialogContent, Fade, FadeProps, Grid, Typography } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'
import CustomTextField from 'src/@core/components/mui/text-field'

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
  onSave: (motive: string) => void
}

const MotiveDialog: React.FC<SaveProps> = ({ onClose, onSave }) => {
  // Para el idioma
  const { t } = useTranslation()
  const [showError, setShowError] = useState(false)
  const [motive, setMotive] = useState<string>('')

  const handleCloseDialog = () => {
    onClose()
  }

  const handleSelect = () => {
    if (motive.length > 0) {
      setShowError(false)
      onSave(motive)
    } else {
      setShowError(true)
    }
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
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Grid container spacing={5} sx={{ marginBottom: '5px' }}>
            <Grid item sm={12}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h3' sx={{ mb: 3 }}>
                  {t('Write a Motive')}
                </Typography>
                <CustomTextField
                  fullWidth
                  value={motive}
                  label={t('Motive')}
                  placeholder={t('Motive')}
                  onChange={e => setMotive(e.target.value)}
                />
                {showError && (
                  <Typography variant='body2' color='error' sx={{ textAlign: 'center' }}>
                    {t('Motive required')}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item sm={12}>
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <Button variant='contained' onClick={() => handleSelect()} sx={{ mr: 4 }}>
                  {t('Save')}
                </Button>
                <Button variant='tonal' color='secondary' onClick={handleCloseDialog}>
                  {t('Cancel')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default MotiveDialog
