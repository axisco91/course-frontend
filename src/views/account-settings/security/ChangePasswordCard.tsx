// ** React Imports
import { ChangeEvent, Fragment, useContext, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import InputAdornment from '@mui/material/InputAdornment'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'
import { activateTwoFactorAuthentication, changePassword } from 'src/api/api'
import { useDispatch } from 'react-redux'
import { authActions } from 'src/reducers/users/AuthReducer'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useRouter } from 'next/router'
import { AuthContext } from 'src/context/AuthContext'
import { FormControlLabel, Switch } from '@mui/material'

interface State {
  showNewPassword: boolean
  showCurrentPassword: boolean
  showConfirmNewPassword: boolean
}

const defaultValues = {
  newPassword: '',
  currentPassword: '',
  confirmNewPassword: ''
}

const schema = yup.object().shape({
  currentPassword: yup.string().min(6).required(),
  newPassword: yup
    .string()
    .min(6)

    /* .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
      'Must contain 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special case character'
    )*/
    .required(),
  confirmNewPassword: yup
    .string()
    .required()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
})

interface FormData {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

const ChangePasswordCard = () => {
  // ** States
  const [values, setValues] = useState<State>({
    showNewPassword: false,
    showCurrentPassword: false,
    showConfirmNewPassword: false
  })

  const { t } = useTranslation()
  const dispatch = useDispatch()
  const router = useRouter()
  const { logout } = useContext(AuthContext)
  const mustChangePassword = useSelector((state: RootState) => state.auth.mustChangePassword)
  const [twoFactor, setTwoFactor] = useState<boolean>(false)

  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  const handleClickShowCurrentPassword = () => {
    setValues({ ...values, showCurrentPassword: !values.showCurrentPassword })
  }

  const handleClickShowNewPassword = () => {
    setValues({ ...values, showNewPassword: !values.showNewPassword })
  }

  const handleClickShowConfirmNewPassword = () => {
    setValues({ ...values, showConfirmNewPassword: !values.showConfirmNewPassword })
  }

  // Cambiamos el estado de los switches
  const handleTwoFactor = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      activateTwoFactorAuthentication({})
        .then(response => {
          if (response.data.success) {
            setTwoFactor(true)
            toast.success(t('Activated'))
          }
        })
        .catch(error => {
          if (error.response) {
            if (error.response.data.errors) {
              reset()
            } else {
              const errorMessage = error.response.data.message
              toast.error(errorMessage, {
                position: 'top-right'
              })
              reset()
            }
          } else {
            // Handle network error (e.g., no response from the server)
            const errorMessage = t('Error with server try again later')
            toast.error(errorMessage, {
              position: 'top-right'
            })
            reset()
          }
        })
    }
  }

  const onPasswordFormSubmit = (data: FormData) => {
    const formData = new FormData()
    formData.append('new_password', data.newPassword)
    formData.append('current_password', data.currentPassword)
    changePassword(formData)
      .then(response => {
        if (response.data.success) {
          if (mustChangePassword) {
            dispatch(authActions.setMustChangePassword(false))
            router.push(`/`)
          }

          const successMessage = t('Password Changed Successfully')
          toast.success(successMessage)
          reset(defaultValues)
        }
      })
      .catch(error => {
        if (error.response) {
          if (error.response.data.errors) {
            reset()
          } else {
            const errorMessage = error.response.data.message
            toast.error(errorMessage, {
              position: 'top-right'
            })
            reset()
          }
        } else {
          // Handle network error (e.g., no response from the server)
          const errorMessage = t('Error with server try again later')
          toast.error(errorMessage, {
            position: 'top-right'
          })
          reset()
        }
      })
  }

  return (
    <Fragment>
      <CardHeader title={t('Change Password')} />
      <form onSubmit={handleSubmit(onPasswordFormSubmit)}>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={6}>
            <Controller
              name='currentPassword'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <CustomTextField
                  fullWidth
                  value={value}
                  onChange={onChange}
                  label={t('Current Password')}
                  placeholder='············'
                  id='input-current-password'
                  error={Boolean(errors.currentPassword)}
                  type={values.showCurrentPassword ? 'text' : 'password'}
                  {...(errors.currentPassword && { helperText: errors.currentPassword.message })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onMouseDown={e => e.preventDefault()}
                          onClick={handleClickShowCurrentPassword}
                        >
                          <Icon
                            fontSize='1.25rem'
                            icon={values.showCurrentPassword ? 'tabler:eye' : 'tabler:eye-off'}
                          />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
        <Grid container spacing={5} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={6}>
            <Controller
              name='newPassword'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <CustomTextField
                  fullWidth
                  value={value}
                  onChange={onChange}
                  label={t('New Password')}
                  id='input-new-password'
                  placeholder='············'
                  error={Boolean(errors.newPassword)}
                  type={values.showNewPassword ? 'text' : 'password'}
                  {...(errors.newPassword && { helperText: errors.newPassword.message })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={handleClickShowNewPassword}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <Icon fontSize='1.25rem' icon={values.showNewPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='confirmNewPassword'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <CustomTextField
                  fullWidth
                  value={value}
                  onChange={onChange}
                  placeholder='············'
                  label={t('Confirm New Password')}
                  id='input-confirm-new-password'
                  error={Boolean(errors.confirmNewPassword)}
                  type={values.showConfirmNewPassword ? 'text' : 'password'}
                  {...(errors.confirmNewPassword && { helperText: errors.confirmNewPassword.message })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onMouseDown={e => e.preventDefault()}
                          onClick={handleClickShowConfirmNewPassword}
                        >
                          <Icon
                            fontSize='1.25rem'
                            icon={values.showConfirmNewPassword ? 'tabler:eye' : 'tabler:eye-off'}
                          />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant='h6'>{t('Password Requirements')}</Typography>
            <Box component='ul' sx={{ pl: 6, mb: 0, '& li': { mb: 1.5, color: 'text.secondary' } }}>
              <li>{t('Minimum 6 characters long - the more, the better')}</li>
            </Box>
            <Box>{t('To choose a strong password')}</Box>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              labelPlacement='start'
              label={t('Activate two factor authentication')}
              control={<Switch checked={twoFactor} onChange={handleTwoFactor} />}
            />
          </Grid>
          <Grid
            item
            xs={12}
            sx={{ pt: theme => `${theme.spacing(6.5)} !important`, display: 'flex', justifyContent: 'flex-end' }}
          >
            {mustChangePassword && (
              <Button variant='contained' color='error' onClick={logout} sx={{ mr: 4 }}>
                <Icon icon={'tabler:logout'} style={{ marginRight: '5px' }} />
                {t('Log out')}
              </Button>
            )}
            <Button variant='contained' type='submit' sx={{ mr: 4 }}>
              <Icon icon='tabler:device-floppy' fontSize={20} />
              {t('Save Changes')}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Fragment>
  )
}

export default ChangePasswordCard
