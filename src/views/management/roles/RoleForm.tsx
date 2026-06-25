// ** React Imports
import { useContext, useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Third Party Imports
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { SubmitHandler, Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'

// ** Icon Imports
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Styled Components
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

// ** Llamadas API
import { storeRole, updateRole } from 'src/api/api'
import { useRouter } from 'next/router'

import { useDispatch } from 'react-redux'
import { roleActions } from 'src/reducers/management/RoleReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

// para las traducciones
type TranslationFunction = (key: string) => string

// Para controlar los validations
const schema = (t: TranslationFunction) => {
  return yup.object().shape({
    name: yup.string().required(t('Name is required'))
  })
}

const RoleForm = () => {
  // Para el idioma
  const { t } = useTranslation()
  const router = useRouter()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const role = useSelector((state: RootState) => state.role.role)
  const id = useSelector((state: RootState) => state.role.id)

  // Controlar para que solo puede pinchar en el botón de guardar una vez para que no se cree datos duplicado
  const [saving, setSaving] = useState<boolean>(false)

  // Obtenemos los datos de inicio del rol
  const defaultValues = {
    name: role && role.name ? role.name : ''
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
      storeRole(formData)
        .then(response => {
          // Vemos si nos da un success y lo indicamos
          if (response.data.success) {
            toast.success(response.data.message)
            router.push(`/general-settings/roles/edit/${response.data.data.role.id}`)
          }
        })
        .catch(error => {
          setSaving(false)
          handleError(error, logout)
        })
    } else {
      updateRole(id, formData)
        .then(response => {
          setSaving(false)

          // Vemos si nos da un success y lo indicamos
          if (response.data.success) {
            toast.success(response.data.message)
          }
        })
        .catch(error => {
          setSaving(false)
          handleError(error, logout)
        })
    }
  }

  return (
    <DatePickerWrapper>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={3}>
            <Controller
              name='name'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <CustomTextField
                  fullWidth
                  value={value}
                  onChange={onChange}
                  label={t('Name')}
                  id='input-name'
                  placeholder={t('Name')}
                  error={Boolean(errors.name)}
                  {...(errors.name && { helperText: errors.name.message })}
                />
              )}
            />
          </Grid>
          <Grid
            item
            xs={12}
            sx={{ pt: theme => `${theme.spacing(6.5)} !important`, display: 'flex', justifyContent: 'flex-end' }}
          >
            <Button variant='contained' type='submit' sx={{ mr: 4 }} disabled={saving}>
              {t('Save')}
            </Button>
            <Button
              variant='contained'
              color='secondary'
              sx={{ mr: 4 }}
              onClick={() => {
                dispatch(roleActions.setRole(null))
                dispatch(roleActions.setId(null))
                router.push(`/general-settings/roles`)
              }}
            >
              {t('Back')}
            </Button>
          </Grid>
        </Grid>
      </form>
    </DatePickerWrapper>
  )
}

export default RoleForm
