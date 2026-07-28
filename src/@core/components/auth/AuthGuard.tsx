// ** React Imports
import { ReactNode, ReactElement, useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// ** Hooks Import
import { useAuth } from 'src/hooks/useAuth'

interface AuthGuardProps {
  children: ReactNode
  fallback: ReactElement | null
}

const AuthGuard = (props: AuthGuardProps) => {
  const { children, fallback } = props
  const auth = useAuth()
  const router = useRouter()

  useEffect(
    () => {
      if (!router.isReady) {
        return
      }

      if (!auth.loading && !auth.initializationError && auth.user === null) {
        if (router.asPath !== '/') {
          router.replace({
            pathname: '/login',
            query: { returnUrl: router.asPath }
          })
        } else {
          router.replace('/login')
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auth.initializationError, auth.loading, auth.user, router]
  )

  if (auth.loading) {
    return fallback
  }

  if (auth.initializationError) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          px: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant='h5'>No se ha podido recuperar la sesión</Typography>
        <Typography color='text.secondary'>Comprueba la conexión y vuelve a intentarlo.</Typography>
        <Button variant='contained' onClick={() => void auth.retryInitialization()}>
          Reintentar
        </Button>
      </Box>
    )
  }

  if (auth.user === null) return fallback

  return <>{children}</>
}

export default AuthGuard
