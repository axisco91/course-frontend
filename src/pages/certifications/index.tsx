import { Card, CardContent } from '@mui/material'
import Grid from '@mui/material/Grid'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { RootState } from 'src/reducers/types/types'
import { certificationActions } from 'src/reducers/general/CertificationReducer'
import CertificationsDelete from 'src/views/certifications/CertificationsDelete'
import CertificationsFilters from 'src/views/certifications/CertificationsFilters'
import CertificationsModal from 'src/views/certifications/CertificationsModal'
import CertificationsTable from 'src/views/certifications/CertificationsTable'

const Certifications = () => {
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.certification.modalOpen)
  const modalMode = useSelector((state: RootState) => state.certification.modalMode)
  const id = useSelector((state: RootState) => state.certification.id)

  useEffect(() => {
    dispatch(certificationActions.closeModal?.())
    dispatch(certificationActions.setId?.(null))
    dispatch(certificationActions.setName?.(''))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <CertificationsFilters />
            </CardContent>

            <CardContent>
              <CertificationsTable />
            </CardContent>

            <CertificationsModal
              open={modalOpen}
              mode={modalMode}
              certificationId={id}
              onClose={() =>
                dispatch(
                  certificationActions.closeModal?.() ?? {
                    type: 'certification/closeModal'
                  }
                )
              }
            />

            <CertificationsDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Certifications
