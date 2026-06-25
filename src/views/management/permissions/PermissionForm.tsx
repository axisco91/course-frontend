// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef, useContext, useState } from 'react'

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
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'
import { storePermission, updatePermission } from 'src/api/api'
import { Dialog, DialogActions, DialogContent, Fade, FadeProps } from '@mui/material'
import 'react-datepicker/dist/react-datepicker.css'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

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

type TranslationFunction = (key: string) => string

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    name: yup.string().required(t('Name is required'))
  })

interface PermissionFormProps {
  title: string
  setId: (id: number | null) => void
  id: number | null
  onClose: () => void
  onSave: () => void
}

const PermissionForm: React.FC<PermissionFormProps> = ({ title, id, onClose, onSave }) => {
  // Para el idioma
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const permission = useSelector((state: RootState) => state.permission.permission)

  // Controlar para que solo puede pinchar en el botón de guardar una vez para que no se cree datos duplicado
  const [saving, setSaving] = useState<boolean>(false)

  // Iniciamos los datos por defecto de los inputs
  const defaultValues: Record<string, string> = {
    name: permission && permission.name ? permission.name : ''
  }

  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema(t)) })

  // Realizamos el método de guardar
  const onFormSubmit: SubmitHandler<any> = data => {
    setSaving(true)

    // Creamos el formData y añadimos los elementos
    const formData = new FormData()
    formData.append('name', data.name)
    if (!id) {
      storePermission(formData)
        .then(response => {
          // Vemos si nos da un success y lo indicamos
          if (response.data.success) {
            toast.success(response.data.message)
            handleSaveDialog()
            setSaving(false)
          }
        })
        .catch(error => {
          setSaving(false)
          handleError(error, logout)
        })
    } else {
      updatePermission(id, formData)
        .then(response => {
          setSaving(false)

          // Vemos si nos da un success y lo indicamos
          if (response.data.success) {
            toast.success(response.data.message)
            handleSaveDialog()
          }
        })
        .catch(error => {
          setSaving(false)
          handleError(error, logout)
        })
    }
  }

  const handleSaveDialog = () => {
    onSave()
  }

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
              <Typography variant='h3' sx={{ mb: 3 }}>
                {title}
              </Typography>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={4}>
                  <Controller
                    name='name'
                    control={control}
                    rules={{ required: true }}
                    defaultValue={defaultValues.name}
                    render={({ field: { value, onChange } }) => (
                      <CustomTextField
                        fullWidth
                        value={value}
                        onChange={onChange}
                        label={t('Name')}
                        placeholder={t('Name')}
                        id='input-name'
                        error={Boolean(errors.name)}
                        {...(errors.name && { helperText: errors.name.message })}
                      />
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
            <Button variant='contained' type='submit' sx={{ mr: 4 }} disabled={saving}>
              {t('Save')}
            </Button>
            <Button variant='tonal' color='secondary' onClick={handleCloseDialog}>
              {t('Cancel')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Fragment>
  )
}

export default PermissionForm
