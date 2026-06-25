// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import OccupationsFilters from 'src/views/occupations/OccupationsFilters'
import OccupationsTable from 'src/views/occupations/OccupationsTable'
import OccupationsModel from 'src/views/occupations/OccupationsModal'
import OccupationsDelete from 'src/views/occupations/OccupationsDelete'
import { occupationActions } from 'src/reducers/trainingContracts/OccupationsReducer'

const Occupations = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.occupation.modalOpen)
  const modalMode = useSelector((state: RootState) => state.occupation.modalMode)
  const id = useSelector((state: RootState) => state.occupation.id)

  useEffect(() => {
    dispatch(occupationActions.closeModal?.())
    dispatch(occupationActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <OccupationsFilters />
            </CardContent>

            <CardContent>
              <OccupationsTable />
            </CardContent>

            <OccupationsModel
              open={modalOpen}
              mode={modalMode}
              occupationId={id}
              onClose={() =>
                dispatch(
                  occupationActions.closeModal?.() ?? {
                    type: 'occupation/closeModal'
                  }
                )
              }
            />

            <OccupationsDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Occupations
