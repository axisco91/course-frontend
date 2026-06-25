import { Card, CardContent } from '@mui/material'
import Grid from '@mui/material/Grid'
import { useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getDocumentTypes } from 'src/api/api'
import { AuthContext } from 'src/context/AuthContext'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { documentActions } from 'src/reducers/general/DocumentReducer'
import { documentTypeActions } from 'src/reducers/general/DocumentTypeReducer'
import { RootState } from 'src/reducers/types/types'
import Permission from 'src/views/components/Permission'
import DocumentTypesDelete from 'src/views/document-types/DocumentTypesDelete'
import DocumentTypesFilters from 'src/views/document-types/DocumentTypesFilters'
import DocumentTypesModal from 'src/views/document-types/DocumentTypesModal'
import DocumentTypesTable from 'src/views/document-types/DocumentTypesTable'

const DocumentTypes = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const modalOpen = useSelector((state: RootState) => state.document.modalOpen)
  const modalMode = useSelector((state: RootState) => state.document.modalMode)
  const id = useSelector((state: RootState) => state.document.id)

  useEffect(() => {
    dispatch(documentActions.closeModal?.())
    dispatch(documentActions.setId?.(null))
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const fetchDocumentTypes = async () => {
      try {
        const res = await getDocumentTypes()
        if (cancelled) return

        const list = res.data?.data?.document_types ?? res.data?.data ?? res.data ?? []
        dispatch(documentTypeActions.setDocumentTypes(Array.isArray(list) ? list : []))
      } catch (error) {
        if (!cancelled) {
          handleError(error, logout)
        }
      }
    }

    fetchDocumentTypes()

    return () => {
      cancelled = true
    }
  }, [dispatch, handleError, logout])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <DocumentTypesFilters />
            </CardContent>

            <CardContent>
              <DocumentTypesTable />
            </CardContent>

            <DocumentTypesModal
              open={Boolean(modalOpen)}
              mode={String(modalMode) as 'view' | 'edit' | 'create'}
              documentId={id}
              onClose={() => dispatch(documentActions.closeModal())}
            />

            <DocumentTypesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default DocumentTypes
