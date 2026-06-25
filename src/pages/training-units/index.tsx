import { Card, CardContent } from '@mui/material'
import Grid from '@mui/material/Grid'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { trainingUnitActions } from 'src/reducers/general/TrainingUnitReducer'
import { RootState } from 'src/reducers/types/types'
import TrainingUnitsDelete from 'src/views/training-units/TrainingUnitsDelete'
import TrainingUnitsFilters from 'src/views/training-units/TrainingUnitsFilters'
import TrainingUnitsModal from 'src/views/training-units/TrainingUnitsModal'
import TrainingUnitsTable from 'src/views/training-units/TrainingUnitsTable'

const TrainingUnits = () => {
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.trainingUnit.modalOpen)
  const modalMode = useSelector((state: RootState) => state.trainingUnit.modalMode)
  const id = useSelector((state: RootState) => state.trainingUnit.id)

  useEffect(() => {
    dispatch(trainingUnitActions.closeModal?.())
    dispatch(trainingUnitActions.setId?.(null))
    dispatch(trainingUnitActions.setName?.(''))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TrainingUnitsFilters />
            </CardContent>

            <CardContent>
              <TrainingUnitsTable />
            </CardContent>

            <TrainingUnitsModal
              open={modalOpen}
              mode={modalMode}
              trainingUnitId={id}
              onClose={() =>
                dispatch(
                  trainingUnitActions.closeModal?.() ?? {
                    type: 'trainingUnit/closeModal'
                  }
                )
              }
            />

            <TrainingUnitsDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default TrainingUnits
