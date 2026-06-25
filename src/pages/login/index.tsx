// ** React Imports
import { useState, ReactNode, useEffect } from 'react'

// ** Next Imports
import Link from 'next/link'

// ** MUI Components
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import { styled } from '@mui/material/styles'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useTranslation } from 'react-i18next'

type ApiResponse = {
  success: boolean
  message: string
}

// ** Styled Components
const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: `${theme.palette.primary.main} !important`
}))

// para las traducciones
type TranslationFunction = (key: string) => string

const schema = (t: TranslationFunction) => {
  return yup.object().shape({
    user: yup.string().required(t('User is required')),
    password: yup.string().required(t('Password is required'))
  })
}

interface FormData {
  user: string
  password: string
}

const defaultValues: FormData = {
  password: '',
  user: ''
}

const LoginPage = () => {
  const { t } = useTranslation()
  const logo = useSelector((state: RootState) => state.layout.logo)

  const auth = useAuth()

  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [typedManually, setTypedManually] = useState(false)

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(schema(t))
  })

  const onSubmit = async (data: FormData) => {
    const { user, password } = data

    auth.login(
      { user, password },
      (_responseData: ApiResponse) => {
        // éxito
      },
      error => {
        setError('user', {
          type: 'manual',
          message: error?.message || 'Usuario o contraseña inválido'
        })
      }
    )
  }

  // (Tu lógica original para detectar autofill/tecleo manual)
  useEffect(() => {
    const input = document.getElementById('auth-login-v2-password') as HTMLInputElement | null
    if (!input) return

    const observer = new MutationObserver(() => {
      // Detectar autofill (cuando cambia el atributo 'value' sin onChange)
      if (input.value && !typedManually) {
        setTypedManually(false)
      }
    })

    observer.observe(input, {
      attributes: true,
      attributeFilter: ['value']
    })

    return () => observer.disconnect()
  }, [typedManually])

  useEffect(() => {
    window.localStorage.removeItem('2fa_user_id')
    window.localStorage.removeItem('2fa_method')
  }, [])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        bgcolor: '#fff',
        overflow: 'hidden',
        px: 2
      }}
    >
      {/* Fondo grande tipo "ZONA AVZ" (usa una imagen para que quede igual al screenshot) */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        <Box
          component='img'
          src='/images/pages/zona-bg.png'
          alt=''
          sx={{
            width: { xs: '120%', md: '85%' },
            maxWidth: 1500,
            height: 'auto'
          }}
        />
      </Box>

      {/* Card centrada */}
      <Paper
        elevation={8}
        sx={{
          width: 'min(420px, 92vw)',
          borderRadius: 4,
          px: 5,
          py: 4,
          position: 'relative',
          boxShadow: '0 12px 35px rgba(0,0,0,.12)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {logo && <Box component='img' src={logo} sx={{ width: 190, height: 'auto' }} />}
        </Box>

        <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          {/* Usuario */}
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Usuario</Typography>
          <Box sx={{ mb: 2 }}>
            <Controller
              name='user'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  autoFocus
                  placeholder='Usuario'
                  label={undefined}
                  {...field}
                  error={Boolean(errors.user)}
                  helperText={errors.user?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2 }
                  }}
                />
              )}
            />
          </Box>

          {/* Contraseña */}
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Contraseña</Typography>
          <Box sx={{ mb: 1.5 }}>
            <Controller
              name='password'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange, onBlur } }) => (
                <CustomTextField
                  fullWidth
                  value={value}
                  onBlur={onBlur}
                  placeholder='••••••••'
                  label={undefined}
                  onChange={e => {
                    const newValue = e.target.value

                    // Si se empieza a escribir manualmente
                    if (!typedManually && newValue.length === 1) setTypedManually(true)

                    // Si se borra
                    if (newValue.length === 0) setTypedManually(false)

                    onChange(e)
                  }}
                  id='auth-login-v2-password'
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  type={showPassword ? 'text' : 'password'}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2 }
                  }}
                  InputProps={{
                    endAdornment:
                      typedManually && value ? (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <Icon fontSize='1.25rem' icon={showPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                  }}
                />
              )}
            />
          </Box>

          {/* Recuérdame */}
          <FormControlLabel control={<Checkbox />} label='Recuérdame' sx={{ mb: 2, userSelect: 'none' }} />

          {/* Botón */}
          <Button
            fullWidth
            type='submit'
            variant='contained'
            sx={{
              py: 1.2,
              borderRadius: 2,
              bgcolor: '#F07A00',
              '&:hover': { bgcolor: '#d96e00' }
            }}
          >
            Acceder
          </Button>

          {/* Enlace opcional */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography component={LinkStyled} href='/forgot-password'>
              Olvidado la Contraseña
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  )
}

LoginPage.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>
LoginPage.guestGuard = true

export default LoginPage
