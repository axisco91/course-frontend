// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import * as yup from 'yup'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogActions, DialogContent, Fade, FadeProps } from '@mui/material'
import 'react-datepicker/dist/react-datepicker.css'
import { normalSelectListWithoutId } from 'src/context/formDataUtils'

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

const schema = () => yup.object().shape({})

interface ImportFormProps {
  title: string
  importText: string
  onClose: () => void
  onSave: (importYear: number | null) => void
  years: any[]
}

const ImportWithYearForm: React.FC<ImportFormProps> = ({ title, importText, onClose, onSave, years }) => {
  // Para el idioma
  const { t } = useTranslation()

  // Iniciamos los datos por defecto de los inputs
  const defaultValues: Record<string, string> = {}

  // ** Hooks
  const {
    control,
    handleSubmit,
    formState: {}
  } = useForm({ defaultValues, resolver: yupResolver(schema()) })

  // Realizamos el metodo de guardar
  const onFormSubmit: SubmitHandler<any> = data => {
    onSave(data.year)
  }

  const handleCloseDialog = () => {
    onClose()
  }

  // lista de los años
  const yearsList = normalSelectListWithoutId(years, 2023)

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
        <form onSubmit={handleSubmit(onFormSubmit)}>
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
              <Grid container spacing={5}>
                <Typography variant='h3' sx={{ mb: 3 }}>
                  {title}
                </Typography>
              </Grid>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={12}>
                  <Typography>{importText}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}></Grid>
                <Grid item xs={12} sm={4}>
                  <Controller
                    name='year'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <CustomTextField
                        select
                        fullWidth
                        value={value || yearsList[0].props.value} // Set the initial value to the first element as a string
                        onChange={onChange}
                        label={t('Year')}
                        id='input-year'
                      >
                        {yearsList}
                      </CustomTextField>
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              justifyContent: 'center',
              px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
              pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
            }}
          >
            <Button variant='contained' type='submit' sx={{ mr: 4 }}>
              <Icon icon='tabler:device-floppy' fontSize={20} />
              {t('Save')}
            </Button>
            <Button variant='tonal' color='secondary' onClick={handleCloseDialog}>
              <Icon icon='tabler:arrow-back' fontSize={20} />
              {t('Cancel')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Fragment>
  )
}

export default ImportWithYearForm
