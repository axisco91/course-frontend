import { useRouter } from 'next/router'
import ViewPdfViewer from 'src/views/view-pdf/ViewPdfViewer'
import BlankLayout from 'src/@core/layouts/BlankLayout'

const ViewPdfPage = () => {
  const router = useRouter()
  const pdfKey = router.query.pdfKey

  // en Next puede venir undefined al principio (hydration)
  if (!pdfKey) return null

  return <ViewPdfViewer pdfKey={String(pdfKey)} />
}

export default ViewPdfPage

// ✅ pública + layout blanco
ViewPdfPage.authGuard = false
ViewPdfPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
