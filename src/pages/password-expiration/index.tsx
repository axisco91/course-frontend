// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { useTranslation } from 'react-i18next'

import { ReactNode, useEffect } from 'react'
import { Card, CardContent } from '@mui/material'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import ChangePasswordCard from 'src/views/account-settings/security/ChangePasswordCard'
import { Box } from '@mui/system'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useRouter } from 'next/router'

const PasswordExpiration = () => {
  const { t } = useTranslation()
  const logo = useSelector((state: RootState) => state.layout.logo)
  const router = useRouter()
  const mustChangePassword = useSelector((state: RootState) => state.auth.mustChangePassword)

  useEffect(() => {
    if (!mustChangePassword) {
      router.back() // 🔙 vuelve a la página anterior
    }
  }, [mustChangePassword, router])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f9f9f9',
        px: 4,
        pt: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}
    >
      <Grid container spacing={6} maxWidth='l'>
        <Grid item xs={12} textAlign='center'>
          <img src={logo} width={300} alt='' />
        </Grid>

        <Grid item xs={12}>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 6 }}>
              <Typography variant='body1' sx={{ mb: 4 }}>
                {t(
                  'You must update your password because it is the first time you log in or it has been 30 days since your last update.'
                )}
              </Typography>
              <ChangePasswordCard />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

PasswordExpiration.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>

export default PasswordExpiration
