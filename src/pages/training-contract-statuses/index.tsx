import Grid from '@mui/material/Grid'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { trainingContractStatusActions } from 'src/reducers/trainingContracts/TrainingContractStatusReducer'
import TrainingContractStatusesFilters from 'src/views/training-contract-statuses/TrainingContractStatusesFilters'
import TrainingContractStatusesTable from 'src/views/training-contract-statuses/TrainingContractStatusesTable'
import TrainingContractStatusesModal from 'src/views/training-contract-statuses/TrainingContractStatusesModal'
import TrainingContractStatusesDelete from 'src/views/training-contract-statuses/TrainingContractStatusesDelete'

const TrainingContractStatuses = () => {
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.trainingContractStatus.modalOpen)
  const modalMode = useSelector((state: RootState) => state.trainingContractStatus.modalMode)
  const id = useSelector((state: RootState) => state.trainingContractStatus.id)

  useEffect(() => {
    dispatch(trainingContractStatusActions.closeTrainingContractStatusModal?.() ?? trainingContractStatusActions.closeModal())
    dispatch(trainingContractStatusActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TrainingContractStatusesFilters />
            </CardContent>

            <CardContent>
              <TrainingContractStatusesTable />
            </CardContent>

            <TrainingContractStatusesModal
              open={modalOpen}
              mode={modalMode}
              trainingContractStatusId={id}
              onClose={() =>
                dispatch(
                  trainingContractStatusActions.closeTrainingContractStatusModal?.() ??
                    trainingContractStatusActions.closeModal()
                )
              }
            />

            <TrainingContractStatusesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default TrainingContractStatuses
