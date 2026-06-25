import { Fragment, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Box, Button, Typography } from '@mui/material'

const SignatureComponent = ({ onSignatureChange, disabled = false }) => {
  const sigCanvas = useRef(null)
  const [isSignatureBlank, setIsSignatureBlank] = useState(true)

  const clearSignature = () => {
    if (!sigCanvas.current) return
    sigCanvas.current.clear()
    setIsSignatureBlank(true)
    if (typeof onSignatureChange === 'function') onSignatureChange(null)
  }

  const saveSignature = () => {
    if (!sigCanvas.current) return
    const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
    if (typeof onSignatureChange === 'function') onSignatureChange(signatureData)
    setIsSignatureBlank(false)
  }

  return (
    <Fragment>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography sx={{ textAlign: 'center' }}>Firma en el cuadro de abajo</Typography>

        <Box
          sx={{
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: theme => theme.shadows[2],
            backgroundColor: 'white'
          }}
        >
          <SignatureCanvas
            ref={sigCanvas}
            penColor='black'
            canvasProps={{
              width: 400,
              height: 200,
              style: { backgroundColor: 'white' }
            }}
            onEnd={() => setIsSignatureBlank(false)}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Button variant='outlined' onClick={clearSignature} disabled={disabled}>
            Limpiar
          </Button>

          <Button variant='contained' onClick={saveSignature} disabled={disabled || isSignatureBlank}>
            Firmar
          </Button>
        </Box>
      </Box>
    </Fragment>
  )
}

export default SignatureComponent
