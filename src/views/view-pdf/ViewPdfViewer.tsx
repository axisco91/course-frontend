import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Box, Card, CardContent, Typography, Divider, Button } from '@mui/material'
import Icon from 'src/@core/components/icon'
import SavingDialog from 'src/views/components/SavingDialog'

// ✅ Ajusta a tus endpoints reales
import { viewPdf, signDocument } from 'src/api/api'

import SignatureComponent from './SignatureComponent'

const ViewPdfViewer = ({ pdfKey }) => {
  const [pdfUrl, setPdfUrl] = useState('')
  console.log(pdfKey)
  const [signed, setSigned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signing, setSigning] = useState(false)

  // evita dobles llamadas en React.StrictMode (dev)
  const didLoadRef = useRef(false)

  const loadPdf = useCallback(async () => {
    if (!pdfKey) return

    setLoading(true)
    try {
      const res = await viewPdf(pdfKey)

      if (res?.status !== 200) {
        toast.error(res?.data?.message ?? 'No se pudo cargar el PDF')

        return
      }

      const data = res.data?.data ?? res.data ?? {}
      setSigned(Boolean(data.signed))
      setPdfUrl(String(data.pdfUrl ?? data.pdf_url ?? ''))
    } catch (e) {
      console.error(e)
      toast.error('Error cargando el PDF')
    } finally {
      setLoading(false)
    }
  }, [pdfKey])

  useEffect(() => {
    if (!pdfKey) return

    // si cambia el pdfKey, permitimos volver a cargar
    didLoadRef.current = false
    setPdfUrl('')
    setSigned(false)
  }, [pdfKey])

  useEffect(() => {
    if (!pdfKey) return
    if (didLoadRef.current) return
    didLoadRef.current = true
    loadPdf()
  }, [pdfKey, loadPdf])

  const handleSignatureChange = useCallback(
    async newSignatureData => {
      if (!pdfKey) return
      if (!newSignatureData) return

      setSigning(true)
      try {
        const formData = new FormData()

        // ✅ SignatureComponent normalmente devuelve base64 string (dataURL)
        if (newSignatureData instanceof Blob || newSignatureData instanceof File) {
          formData.append('image', newSignatureData)
        } else if (typeof newSignatureData === 'string') {
          const blob = await (await fetch(newSignatureData)).blob()
          formData.append('image', blob, 'signature.png')
        } else {
          toast.error('Firma inválida')

          return
        }

        formData.append('key', String(pdfKey))

        const res = await signDocument(formData)

        if (res?.status !== 200) {
          toast.error(res?.data?.message ?? 'No se pudo firmar')

          return
        }

        const data = res.data?.data ?? res.data ?? {}
        setSigned(Boolean(data.signed))
        setPdfUrl(String(data.pdfUrl ?? data.pdf_url ?? ''))

        toast.success('Documento firmado')
      } catch (e) {
        console.error(e)
        toast.error('Error firmando el documento')
      } finally {
        setSigning(false)
      }
    },
    [pdfKey]
  )

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 4, py: 6 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Typography variant='h5' sx={{ fontWeight: 800 }}>
              Documento
            </Typography>

            <Button
              variant='outlined'
              onClick={loadPdf}
              disabled={loading || signing || !pdfKey}
              startIcon={<Icon icon='tabler:refresh' />}
            >
              Recargar
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {!pdfKey ? (
            <Typography color='text.secondary'>Falta el identificador del documento.</Typography>
          ) : pdfUrl ? (
            <Box sx={{ width: '100%', height: { xs: 520, md: 700 }, borderRadius: 1, overflow: 'hidden' }}>
              <iframe title='PDF Viewer' src={pdfUrl} width='100%' height='100%' style={{ border: 0 }} />
            </Box>
          ) : (
            <Typography color='text.secondary'>{loading ? 'Cargando PDF…' : 'No hay PDF disponible'}</Typography>
          )}

          {!signed && pdfKey && (
            <Box sx={{ mt: 5 }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>Firma para completar el documento</Typography>

              <SignatureComponent onSignatureChange={handleSignatureChange} disabled={loading || signing} />

              <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
                Al firmar, el documento se actualizará automáticamente.
              </Typography>
            </Box>
          )}

          {signed && (
            <Box sx={{ mt: 5 }}>
              <Typography sx={{ fontWeight: 700 }}>✅ Este documento ya está firmado.</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {!signing && loading && <SavingDialog labelKey='Processing Data' />}

      {signing && <SavingDialog />}
    </Box>
  )
}

export default ViewPdfViewer
