import { Box, Button, Card, CardContent, CardHeader, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-hot-toast'
import SignatureComponent from 'src/views/view-pdf/SignatureComponent'
import { potentialStudentActions } from 'src/reducers/students/PotentialStudentReducer'

const PublicPotentialPrivateStudentFinalized = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false)
  const [receiveInformationAccepted, setReceiveInformationAccepted] = useState(false)

  useEffect(() => {
    dispatch(potentialStudentActions.setStudentPrivateSuccess(false))
  }, [dispatch])

  const handleNavigation = async () => {
    toast.success('Solicitud creada correctamente')
    await router.push('/potential-private-student')
  }

  return (
    <Card sx={{ maxWidth: 980, mx: 'auto' }}>
      <CardHeader title='Solicitar Alta Alumno' />
      <CardContent>
        <Typography variant='h6' sx={{ fontWeight: 700, mb: 4 }}>
          Clausula informativa en Materia de protección de datos
        </Typography>

        <Typography sx={{ mb: 3 }}>
          Le recordamos que de acuerdo con el Reglamento UE 2016/679 relativo a la Protección de las Personas
          Físicas en lo que Respecta al Tratamiento de Datos Personales y con la L.O. 3/2018 de Protección de Datos
          Personales y Garantía de Derechos Digitales los datos personales suministrados a través de este documento
          serán incorporados a un fichero titularidad de Avz Formación; autorizando a esta al tratamiento de los
          mismos para su utilización en relación al desarrollo de acciones formativas directamente gestionadas a través
          de la FTFE o de cualquiera de las personas físicas o jurídicas que intervengan en las citadas actividades.
        </Typography>

        <Typography sx={{ mb: 2 }}>
          Si marca esta casilla y en virtud de lo establecido en la Ley 34/2002, de 11 de julio, de Servicios de la
          Sociedad de la Información y de Comercio Electrónico, Avz Formación le informa que podrá utilizar las
          direcciones de correo electrónico facilitadas para remitir información acerca de sus productos y servicios.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={receiveInformationAccepted}
                onChange={event => setReceiveInformationAccepted(event.target.checked)}
              />
            }
            label='Acepto recibir información sobre empleo, formación y asesoramiento profesional'
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <FormControlLabel
            control={
              <Checkbox checked={privacyPolicyAccepted} onChange={event => setPrivacyPolicyAccepted(event.target.checked)} />
            }
            label='Acepto la política de privacidad'
          />
        </Box>

        <SignatureComponent onSignatureChange={setSignatureData} />

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <Button variant='contained' onClick={handleNavigation} disabled={!signatureData || !privacyPolicyAccepted}>
            Crear Solicitud
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default PublicPotentialPrivateStudentFinalized
