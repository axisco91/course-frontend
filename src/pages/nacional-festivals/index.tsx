// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { nacionalFestivalActions } from 'src/reducers/trainingContracts/NacionalFestivalReducer'
import NacionalFestivalsFilters from 'src/views/nacional-festivals/NacionalFestivalsFilters'
import NacionalFestivalsTable from 'src/views/nacional-festivals/NacionalFestivalsTable'
import NacionalFestivalsModel from 'src/views/nacional-festivals/NacionalFestivalsModal'
import NacionalFestivalsDelete from 'src/views/nacional-festivals/NacionalFestivalsDelete'

const NacionalFestivals = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.nacionalFestival.modalOpen)
  const modalMode = useSelector((state: RootState) => state.nacionalFestival.modalMode)
  const id = useSelector((state: RootState) => state.nacionalFestival.id)

  useEffect(() => {
    dispatch(nacionalFestivalActions.closeNacionalFestivalModal?.())
    dispatch(nacionalFestivalActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <NacionalFestivalsFilters />
            </CardContent>

            <CardContent>
              <NacionalFestivalsTable />
            </CardContent>

            <NacionalFestivalsModel
              open={modalOpen}
              mode={modalMode}
              nacionalFestivalId={id}
              onClose={() =>
                dispatch(
                  nacionalFestivalActions.closeNacionalFestivalModal?.() ?? {
                    type: 'teacher-areas/closeModal'
                  }
                )
              }
            />

            <NacionalFestivalsDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default NacionalFestivals
