// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { trainingActionLevelActions } from 'src/reducers/trainingActions/TrainingActionLevelReducer'
import TrainingActionLevelsFilters from 'src/views/training-action-levels/TrainingActionLevelsFilters'
import TrainingActionLevelsTable from 'src/views/training-action-levels/TrainingActionLevelsTable'
import TrainingActionLevelsModel from 'src/views/training-action-levels/TrainingActionLevelsModal'
import TrainingActionLevelsDelete from 'src/views/training-action-levels/TrainingActionLevelsDelete'

const TrainingActionLevels = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.trainingActionLevel.modalOpen)
  const modalMode = useSelector((state: RootState) => state.trainingActionLevel.modalMode)
  const id = useSelector((state: RootState) => state.trainingActionLevel.id)

  useEffect(() => {
    dispatch(trainingActionLevelActions.closeModal?.())
    dispatch(trainingActionLevelActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TrainingActionLevelsFilters />
            </CardContent>

            <CardContent>
              <TrainingActionLevelsTable />
            </CardContent>

            <TrainingActionLevelsModel
              open={modalOpen}
              mode={modalMode}
              trainingActionLevelId={id}
              onClose={() =>
                dispatch(
                  trainingActionLevelActions.closeModal?.() ?? {
                    type: 'training-action-levels/closeModal'
                  }
                )
              }
            />

            <TrainingActionLevelsDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default TrainingActionLevels
