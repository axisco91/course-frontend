// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { incidenceTypeActions } from 'src/reducers/company/IncidenceTypeReducer'
import IncidenceTypesFilters from 'src/views/incidence-types/IncidenceTypesFilters'
import IncidenceTypesTable from 'src/views/incidence-types/IncidenceTypesTable'
import IncidenceTypesModel from 'src/views/incidence-types/IncidenceTypesModal'
import IncidenceTypesDelete from 'src/views/incidence-types/IncidenceTypesDelete'

const IncidenceTypes = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.incidenceType.modalOpen)
  const modalMode = useSelector((state: RootState) => state.incidenceType.modalMode)
  const id = useSelector((state: RootState) => state.incidenceType.id)

  useEffect(() => {
    dispatch(incidenceTypeActions.closeModal?.())
    dispatch(incidenceTypeActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <IncidenceTypesFilters />
            </CardContent>

            <CardContent>
              <IncidenceTypesTable />
            </CardContent>

            <IncidenceTypesModel
              open={modalOpen}
              mode={modalMode}
              incidenceTypeId={id}
              onClose={() =>
                dispatch(
                  incidenceTypeActions.closeModal?.() ?? {
                    type: 'incidence-types/closeModal'
                  }
                )
              }
            />

            <IncidenceTypesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default IncidenceTypes
