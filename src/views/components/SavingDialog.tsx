// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import { Dialog, DialogContent, Fade, FadeProps, Grid, Typography } from '@mui/material'

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

interface SavingDialogProps {
  labelKey?: string
}

const SavingDialog = ({ labelKey = 'Saving' }: SavingDialogProps) => {
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
            pb: theme => `${theme.spacing(8)} !important`,
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Grid container spacing={5} sx={{ marginBottom: '5px' }}>
            <Grid item sm={12}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h3' sx={{ mb: 3 }}>
                  {t(labelKey)}
                </Typography>
                <LoaderSpinner />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Fragment>
  )
}

export default SavingDialog
