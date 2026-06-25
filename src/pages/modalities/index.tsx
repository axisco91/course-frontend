// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { modalityActions } from 'src/reducers/general/ModalityReducer'
import ModalitiesFilters from 'src/views/modalities/ModalitiesFilters'
import ModalitiesTable from 'src/views/modalities/ModalitiesTable'
import ModalitiesModel from 'src/views/modalities/ModalitiesModal'
import ModalitiesDelete from 'src/views/modalities/ModalitiesDelete'

const Modalities = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.modality.modalOpen)
  const modalMode = useSelector((state: RootState) => state.modality.modalMode)
  const id = useSelector((state: RootState) => state.modality.id)

  useEffect(() => {
    dispatch(modalityActions.closeModal?.())
    dispatch(modalityActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ModalitiesFilters />
            </CardContent>

            <CardContent>
              <ModalitiesTable />
            </CardContent>

            <ModalitiesModel
              open={modalOpen}
              mode={modalMode}
              modalityId={id}
              onClose={() =>
                dispatch(
                  modalityActions.closeModal?.() ?? {
                    type: 'modalities/closeModal'
                  }
                )
              }
            />

            <ModalitiesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Modalities
