// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { professionalFamilyActions } from 'src/reducers/general/ProfessionalFamilyReducer'
import ProfessionalFamiliesFilters from 'src/views/professional-families/ProfessionalFamiliesFilters'
import ProfessionalFamiliesTable from 'src/views/professional-families/ProfessionalFamiliesTable'
import ProfessionalFamiliesModel from 'src/views/professional-families/ProfessionalFamiliesModal'
import ProfessionalFamiliesDelete from 'src/views/professional-families/ProfessionalFamiliesDelete'

const ProfessionalCategories = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.professionalFamily.modalOpen)
  const modalMode = useSelector((state: RootState) => state.professionalFamily.modalMode)
  const id = useSelector((state: RootState) => state.professionalFamily.id)

  useEffect(() => {
    dispatch(professionalFamilyActions.closeModal?.())
    dispatch(professionalFamilyActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ProfessionalFamiliesFilters />
            </CardContent>

            <CardContent>
              <ProfessionalFamiliesTable />
            </CardContent>

            <ProfessionalFamiliesModel
              open={modalOpen}
              mode={modalMode}
              professionalFamilyId={id}
              onClose={() =>
                dispatch(
                  professionalFamilyActions.closeModal?.() ?? {
                    type: 'professional-families/closeModal'
                  }
                )
              }
            />

            <ProfessionalFamiliesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default ProfessionalCategories
