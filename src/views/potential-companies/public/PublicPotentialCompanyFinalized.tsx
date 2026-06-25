import { Box, Button, Card, CardContent, CardHeader, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-hot-toast'
import SignatureComponent from 'src/views/view-pdf/SignatureComponent'
import { potentialCompanyActions } from 'src/reducers/company/PotentialCompanyReducer'

const PublicPotentialCompanyFinalized = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false)
  const [receiveInformationAccepted, setReceiveInformationAccepted] = useState(false)

  useEffect(() => {
    dispatch(potentialCompanyActions.setCompanySuccess(false))
  }, [dispatch])

  const handleCreateRequest = async () => {
    toast.success('Solicitud creada correctamente')
    await router.push('/potential-company')
  }

  return (
    <Card sx={{ maxWidth: 980, mx: 'auto' }}>
      <CardHeader title='Solicitar Alta Empresa' />
      <CardContent>
        <Typography variant='h6' sx={{ fontWeight: 700, mb: 4 }}>
          Clausula informativa en Materia de protección de datos
        </Typography>

        <Typography sx={{ mb: 4 }}>
          Le recordamos que de acuerdo con el Reglamento UE 2016/679 relativo a la Protección de las Personas
          Físicas en lo que Respecta al Tratamiento de Datos Personales y con la L.O. 3/2018 de Protección de Datos
          Personales y Garantía de Derechos Digitales los datos personales suministrados a través de este documento
          serán incorporados a un fichero titularidad de Avz Formación; autorizando a esta al tratamiento de los
          mismos para su utilización en relación al desarrollo de acciones formativas directamente gestionadas a través
          de la FTFE o de cualquiera de las personas físicas o jurídicas que intervengan en las citadas actividades.
          La causa que legitima este tratamiento de datos es el consentimiento. Los datos proporcionados se conservarán
          mientras se mantenga la relación profesional o durante los años necesarios para cumplir con las obligaciones
          legales. Sin perjuicio de ello se le informa de que usted podrá ejercitar los derechos de acceso,
          rectificación, supresión, limitación en el tratamiento, portabilidad y oposición enviando una solicitud por
          escrito, acompañada de una fotocopia de su DNI telemáticamente a través del siguiente correo electrónico:
          info@avzformacion.com
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox checked={privacyPolicyAccepted} onChange={e => setPrivacyPolicyAccepted(e.target.checked)} />
            }
            label='Acepto la política de privacidad'
          />
        </Box>

        <Typography sx={{ mb: 2 }}>
          Si marca esta casilla y en virtud de lo establecido en la Ley 34/2002, de 11 de julio, de Servicios de la
          Sociedad de la Información y de Comercio Electrónico, Avz Formación le informa que podrá utilizar las
          direcciones de correo electrónico facilitadas, para remitir información acerca de sus productos y servicios,
          avisos y ofertas y, en general, información sobre empleo, formación y asesoramiento profesional.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={receiveInformationAccepted}
                onChange={e => setReceiveInformationAccepted(e.target.checked)}
              />
            }
            label='Acepto recibir información sobre empleo, formación y asesoramiento profesional'
          />
        </Box>

        <SignatureComponent onSignatureChange={setSignatureData} />

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <Button
            variant='contained'
            onClick={handleCreateRequest}
            disabled={!signatureData || !privacyPolicyAccepted}
          >
            Crear Solicitud
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default PublicPotentialCompanyFinalized
