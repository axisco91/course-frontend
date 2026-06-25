// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import { CardContent, Dialog, DialogActions, DialogContent, Fade, FadeProps, Grid, Typography } from '@mui/material'
import CustomChip from 'src/@core/components/mui/chip'

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { ThemeColor } from 'src/@core/layouts/types'
import { getInitials } from 'src/@core/utils/get-initials'

// Para los dialogs
const Transition = forwardRef(function Transition(
  props: FadeProps & { children?: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Fade ref={ref} {...props} />
})

// ** renders client column
const renderClient = worker => {
  const stateNum = Math.floor(Math.random() * 6)
  const states = ['success', 'error', 'warning', 'info', 'primary', 'secondary']
  const color = states[stateNum]

  // Si tiene foto lo mostramos
  if (worker.profile_photo_path) {
    return <CustomAvatar src={worker.profile_photo_path} sx={{ mr: 3, width: '10rem', height: '10rem' }} />
  } else {
    return (
      <CustomAvatar
        skin='light'
        color={color as ThemeColor}
        sx={{ mr: 3, fontSize: '.8rem', width: '10rem', height: '10rem' }}
      >
        {getInitials(worker.full_name ? worker.full_name : 'John Doe')}
      </CustomAvatar>
    )
  }
}

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
}

const UserDataDialog: React.FC<SaveProps> = ({ onClose }) => {
  // Para el idioma
  const { t } = useTranslation()
  const worker = useSelector((state: RootState) => state.worker.worker)
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
              <CardContent sx={{ pt: 9.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                  {renderClient(worker)}
                  <Typography variant='h4'>{worker.full_name}</Typography>
                  <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
                    <CustomChip
                      rounded
                      size='small'
                      skin='light'
                      color={worker.status_color}
                      label={worker.department_name}
                    />
                  </Box>
                  <Box
                    sx={{
                      mb: 5,
                      gap: 2,
                      width: '100%',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-around'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Typography variant='h4'>{t('Email')}</Typography>
                      <Typography sx={{ color: 'text.secondary' }}>{worker.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Typography variant='h4'>{t('Telephone')}</Typography>
                      <Typography sx={{ color: 'text.secondary' }}>{worker.company_number}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Typography variant='h4'>{t('Social')}</Typography>
                      <Typography sx={{ color: 'text.secondary' }}>{worker.social_username}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                    <Typography variant='h4'>{t('Profile')}</Typography>
                    <Typography sx={{ color: 'text.secondary' }}>{worker.description}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: '15px' }}>
                    <Button variant='tonal' color='secondary' onClick={handleCloseDialog}>
                      <Icon icon='tabler:x' fontSize={20} />
                      {t('Close')}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Grid>
          </Grid>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default UserDataDialog
