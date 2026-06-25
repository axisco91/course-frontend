// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { professionalAreaActions } from 'src/reducers/general/ProfessionalAreaReducer'
import ProfessionalAreasFilters from 'src/views/professional-areas/ProfessionalAreasFilters'
import ProfessionalAreasTable from 'src/views/professional-areas/ProfessionalAreasTable'
import ProfessionalAreasModel from 'src/views/professional-areas/ProfessionalAreasModal'
import ProfessionalAreasDelete from 'src/views/professional-areas/ProfessionaAreasDelete'

const ProfessionalCategories = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.professionalArea.modalOpen)
  const modalMode = useSelector((state: RootState) => state.professionalArea.modalMode)
  const id = useSelector((state: RootState) => state.professionalArea.id)

  useEffect(() => {
    dispatch(professionalAreaActions.closeModal?.())
    dispatch(professionalAreaActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ProfessionalAreasFilters />
            </CardContent>

            <CardContent>
              <ProfessionalAreasTable />
            </CardContent>

            <ProfessionalAreasModel
              open={modalOpen}
              mode={modalMode}
              professionalAreaId={id}
              onClose={() =>
                dispatch(
                  professionalAreaActions.closeModal?.() ?? {
                    type: 'professional-areas/closeModal'
                  }
                )
              }
            />

            <ProfessionalAreasDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default ProfessionalCategories
