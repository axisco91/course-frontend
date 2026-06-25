// ** React Imports
import { ReactNode, useState } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Components
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box, { BoxProps } from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

import * as yup from 'yup'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { passwordReset } from 'src/api/api'
import { useRouter } from 'next/router'
import { IconButton, InputAdornment } from '@mui/material'
import toast from 'react-hot-toast'

// Styled Components
const ForgotPasswordIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  maxHeight: 650,
  marginTop: theme.spacing(12),
  marginBottom: theme.spacing(12),
  [theme.breakpoints.down(1540)]: {
    maxHeight: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxHeight: 500
  }
}))

const RightWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    maxWidth: 450
  },
  [theme.breakpoints.up('lg')]: {
    maxWidth: 600
  },
  [theme.breakpoints.up('xl')]: {
    maxWidth: 750
  }
}))

const LinkStyled = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  justifyContent: 'center',
  color: theme.palette.primary.main,
  fontSize: theme.typography.body1.fontSize
}))

// para las traducciones
type TranslationFunction = (key: string) => string

const schema = (t: TranslationFunction) => {
  return yup.object().shape({
    user: yup.string().required(t('User is required')),
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
}

const defaultValues = {
  user: '',
  newPassword: '',
  confirmNewPassword: ''
}

interface State {
  showNewPassword: boolean
  showConfirmNewPassword: boolean
}

const Reset = () => {
  // ** Hooks
  const theme = useTheme()
  const { t } = useTranslation()
  const logo = useSelector((state: RootState) => state.layout.logo)
  const router = useRouter()
  const { token } = router.query

  // ** Vars
  const hidden = useMediaQuery(theme.breakpoints.down('md'))

  const [values, setValues] = useState<State>({
    showNewPassword: false,
    showConfirmNewPassword: false
  })

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(schema(t))
  })

  const onSubmit = async data => {
    // Obtenemos usuario y contraseña
    const formData = new FormData()
    formData.append('username', data.user)
    formData.append('token', token)
    formData.append('new_password', data.newPassword)
    formData.append('password_confirmation', data.confirmNewPassword)
    passwordReset(formData)
      .then(response => {
        // Vemos si nos da un success y lo indicamos
        if (response.data.success) {
          router.push(`/password-changed`)
        }
      })
      .catch(error => {
        if (error.response) {
          if (error.response.data.errors) {
          } else {
            const errorMessage = error.response.data.message
            toast.error(errorMessage, {
              position: 'top-right'
            })
          }
        } else {
          // Handle network error (e.g., no response from the server)
          const errorMessage = t('Error with server try again later')
          toast.error(errorMessage, {
            position: 'top-right'
          })
        }
      })
  }

  const handleClickShowNewPassword = () => {
    setValues({ ...values, showNewPassword: !values.showNewPassword })
  }

  const handleClickShowConfirmNewPassword = () => {
    setValues({ ...values, showConfirmNewPassword: !values.showConfirmNewPassword })
  }

  return (
    <Box className='content-right' sx={{ backgroundColor: 'background.paper' }}>
      {!hidden ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            borderRadius: '20px',
            justifyContent: 'center',
            backgroundColor: 'customColors.bodyBg',
            margin: theme => theme.spacing(8, 0, 8, 8)
          }}
        >
          <ForgotPasswordIllustration
            alt='forgot-password-illustration'
            src={`/images/pages/auth-v2-forgot-password-illustration-${theme.palette.mode}.png`}
          />
        </Box>
      ) : null}
      <RightWrapper>
        <Box
          sx={{
            p: [6, 12],
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            {logo && <img src={logo} width={300} />}
            <Box sx={{ my: 6 }}>
              <Typography sx={{ mb: 1.5, fontWeight: 500, fontSize: '1.625rem', lineHeight: 1.385 }}>
                {t('Reset Password?')} 🔒
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>{t('Enter your username and new password')}</Typography>
            </Box>
            <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name='user'
                control={control}
                rules={{ required: true }}
                render={({ field: { value = '', onChange, onBlur } }) => (
                  <CustomTextField
                    fullWidth
                    autoFocus
                    label={t('Username')}
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    placeholder={t('Username')}
                    error={Boolean(errors.user)}
                    {...(errors.user && { helperText: errors.user.message })}
                  />
                )}
              />
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
              <Button fullWidth type='submit' variant='contained' sx={{ mb: 4, mt: 4 }}>
                {t('Reset password')}
              </Button>
              <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { mr: 1 } }}>
                <LinkStyled href='/login'>
                  <Icon fontSize='1.25rem' icon='tabler:chevron-left' />
                  <span>{t('Back to login')}</span>
                </LinkStyled>
              </Typography>
            </form>
          </Box>
        </Box>
      </RightWrapper>
    </Box>
  )
}

Reset.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>

Reset.guestGuard = true

export default Reset
