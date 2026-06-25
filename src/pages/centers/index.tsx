// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import CentersDelete from 'src/views/centers/CentersDelete'
import CentersModel from 'src/views/centers/CentersModal'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import CentersTable from 'src/views/centers/CentersTable'
import CentersFilters from 'src/views/centers/CentersFilters'

const Centers = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.center.modalOpen)
  const modalMode = useSelector((state: RootState) => state.center.modalMode)
  const id = useSelector((state: RootState) => state.center.id)

  useEffect(() => {
    dispatch(centerActions.closeCenterModal?.())
    dispatch(centerActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <CentersFilters />
            </CardContent>

            <CardContent>
              <CentersTable />
            </CardContent>

            <CentersModel
              open={modalOpen}
              mode={modalMode}
              centerId={id}
              onClose={() =>
                dispatch(
                  centerActions.closeCenterModal?.() ?? {
                    type: 'centers/closeModal'
                  }
                )
              }
            />

            <CentersDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Centers
