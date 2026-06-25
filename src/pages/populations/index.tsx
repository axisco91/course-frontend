// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { populationActions } from 'src/reducers/general/PopulationReducer'
import PopulationsFilters from 'src/views/populations/PopulationsFilters'
import PopulationsTable from 'src/views/populations/PopulationsTable'
import PopulationsDelete from 'src/views/populations/PopulationsDelete'
import PopulationsModel from 'src/views/populations/PopulationsModal'

const Populations = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.population.modalOpen)
  const modalMode = useSelector((state: RootState) => state.population.modalMode)
  const id = useSelector((state: RootState) => state.population.id)

  useEffect(() => {
    dispatch(populationActions.closeModal?.())
    dispatch(populationActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <PopulationsFilters />
            </CardContent>

            <CardContent>
              <PopulationsTable />
            </CardContent>

            <PopulationsModel
              open={modalOpen}
              mode={modalMode}
              populationId={id}
              onClose={() =>
                dispatch(
                  populationActions.closeModal?.() ?? {
                    type: 'populations/closeModal'
                  }
                )
              }
            />

            <PopulationsDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Populations
