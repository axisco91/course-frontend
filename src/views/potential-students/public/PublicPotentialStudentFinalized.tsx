import { Box, Button, Card, CardContent, CardHeader, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { potentialStudentActions } from 'src/reducers/students/PotentialStudentReducer'

const PublicPotentialStudentFinalized = () => {
  const dispatch = useDispatch()
  const router = useRouter()

  useEffect(() => {
    dispatch(potentialStudentActions.setStudentSuccess(false))
  }, [dispatch])

  return (
    <Card sx={{ maxWidth: 820, mx: 'auto' }}>
      <CardHeader title='Solicitar Alta Alumno' />
      <CardContent>
        <Typography sx={{ mb: 4 }}>
          Finalizado, muchas gracias. En cuanto podamos nos pondremos en contacto contigo.
        </Typography>
        <Box>
          <Button variant='contained' onClick={() => router.push('/potential-student')}>
            Crear Solicitud
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default PublicPotentialStudentFinalized
