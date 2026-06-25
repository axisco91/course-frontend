// Tracings.tsx
import Grid from '@mui/material/Grid'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { trainingActionGroupActions } from 'src/reducers/trainingActions/TrainingActionGroupReducer'
import TrainingActionGroupsFilters from 'src/views/training-action-groups/TrainingActionGroupsFilters'
import TrainingActionGroupsTable from 'src/views/training-action-groups/TrainingActionGroupsTable'
import TrainingActionGroupsModel from 'src/views/training-action-groups/TrainingActionGroupsModal'
import TrainingActionGroupsDelete from 'src/views/training-action-groups/TrainingActionGroupsDelete'

const TrainingActionGroups = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.trainingActionGroup.modalOpen)
  const modalMode = useSelector((state: RootState) => state.trainingActionGroup.modalMode)
  const id = useSelector((state: RootState) => state.trainingActionGroup.id)

  useEffect(() => {
    dispatch(trainingActionGroupActions.closeModal?.())
    dispatch(trainingActionGroupActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TrainingActionGroupsFilters />
            </CardContent>

            <CardContent>
              <TrainingActionGroupsTable />
            </CardContent>

            <TrainingActionGroupsModel
              open={modalOpen}
              mode={modalMode}
              trainingActionGroupId={id}
              onClose={() =>
                dispatch(
                  trainingActionGroupActions.closeModal?.() ?? {
                    type: 'training-action-groups/closeModal'
                  }
                )
              }
            />

            <TrainingActionGroupsDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default TrainingActionGroups
