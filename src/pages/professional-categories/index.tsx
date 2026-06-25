// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import ProfessionalCategoriesModel from 'src/views/professional-categories/ProfessionalCategoriesModal'
import ProfessionalCategoriesDelete from 'src/views/professional-categories/ProfessionalCateogoriesDelete'
import ProfessionalCategoriesTable from 'src/views/professional-categories/ProfessionalCategoriesTable'
import ProfessionalCategoriesFilters from 'src/views/professional-categories/ProfessionalCategoriesFilters'
import { professionalCategoryActions } from 'src/reducers/general/ProfessionalCategoryReducer'

const ProfessionalCategories = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.professionalCategory.modalOpen)
  const modalMode = useSelector((state: RootState) => state.professionalCategory.modalMode)
  const id = useSelector((state: RootState) => state.professionalCategory.id)

  useEffect(() => {
    dispatch(professionalCategoryActions.closeModal?.())
    dispatch(professionalCategoryActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ProfessionalCategoriesFilters />
            </CardContent>

            <CardContent>
              <ProfessionalCategoriesTable />
            </CardContent>

            <ProfessionalCategoriesModel
              open={modalOpen}
              mode={modalMode}
              professionalCategoryId={id}
              onClose={() =>
                dispatch(
                  professionalCategoryActions.closeModal?.() ?? {
                    type: 'professiona-categories/closeModal'
                  }
                )
              }
            />

            <ProfessionalCategoriesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default ProfessionalCategories
