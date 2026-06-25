// ** React Imports
import { ReactNode } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Components
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box, { BoxProps } from '@mui/material/Box'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import FooterIllustrations from 'src/views/pages/misc/FooterIllustrations'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Styled Components
const BoxWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    width: '90vw'
  }
}))

const Img = styled('img')(({ theme }) => ({
  [theme.breakpoints.down('lg')]: {
    height: 450,
    marginTop: theme.spacing(10)
  },
  [theme.breakpoints.down('md')]: {
    height: 400
  },
  [theme.breakpoints.up('lg')]: {
    marginTop: theme.spacing(20)
  }
}))

const Unauthorized = () => {
  // obtenemos el logo
  const logo = useSelector((state: RootState) => state.layout.logo)
  const { t } = useTranslation()

  return (
    <Box className='content-center'>
      <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <BoxWrapper sx={{ p: 10 }}>
          <Typography variant='h2' sx={{ mb: 1.5 }}>
            {t('Page Not Found')} :(
          </Typography>
          <Typography sx={{ mb: 6, color: 'text.secondary' }}>
            Oops! 😖 {t('The requested URL was not found on this server')}.
          </Typography>
          <Button href='/' component={Link} variant='contained'>
            {t('Back to Home')}
          </Button>
        </BoxWrapper>
        {logo && <img src={logo} width={300} />}
      </Box>
      <FooterIllustrations />
    </Box>
  )
}

Unauthorized.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>

export default Unauthorized
