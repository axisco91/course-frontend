// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import { Dialog, DialogContent, Fade, FadeProps, Typography } from '@mui/material'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'
import { LoaderSpinner } from './loader'

// Para los dialogs
const Transition = forwardRef(function Transition(
  props: FadeProps & { children?: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Fade ref={ref} {...props} />
})

const LoadingDialog = () => {
  // Para el idioma
  const { t } = useTranslation()

  return (
    <Fragment>
      <Dialog
        data-backdrop-confirm='off'
        fullWidth
        open={true}
        maxWidth='md'
        scroll='body'
        TransitionComponent={Transition}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogContent
          sx={{
            height: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(4)} !important`, `${theme.spacing(4)} !important`],
            pb: theme => [`${theme.spacing(4)} !important`, `${theme.spacing(4)} !important`]
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant='h3' sx={{ mb: 3 }}>
              {t('Processing Data')}
            </Typography>
            <LoaderSpinner />
          </Box>
        </DialogContent>
      </Dialog>
    </Fragment>
  )
}

export default LoadingDialog
