// Tracings.tsx
import Grid from '@mui/material/Grid'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { trainingContractSerieActions } from 'src/reducers/trainingContracts/TrainingContractSerieReducer'
import SeriesFilters from 'src/views/series/SeriesFilters'
import SeriesTable from 'src/views/series/SeriesTable'
import SeriesModel from 'src/views/series/SeriesModal'
import SerieDelete from 'src/views/series/SeriesDelete'

const ProfessionalCategories = () => {
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.trainingContractSerie.modalOpen)
  const modalMode = useSelector((state: RootState) => state.trainingContractSerie.modalMode)
  const id = useSelector((state: RootState) => state.trainingContractSerie.id)

  useEffect(() => {
    dispatch(trainingContractSerieActions.closeModal?.())
    dispatch(trainingContractSerieActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <SeriesFilters />
            </CardContent>

            <CardContent>
              <SeriesTable />
            </CardContent>

            <SeriesModel
              open={modalOpen}
              mode={modalMode}
              serieId={id}
              onClose={() =>
                dispatch(
                  trainingContractSerieActions.closeModal?.() ?? {
                    type: 'trainingContractSerie/closeModal'
                  }
                )
              }
            />

            <SerieDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default ProfessionalCategories
