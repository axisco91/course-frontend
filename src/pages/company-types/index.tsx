// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { companyTypeActions } from 'src/reducers/company/CompanyTypeReducer'
import CompanyTypesModal from 'src/views/company-types/CompanyTypesModal'
import CompanyTypesTable from 'src/views/company-types/CompanyTypesTable'
import CompanyTypesFilters from 'src/views/company-types/CompanyTypesFilters'
import CompanyTypesDelete from 'src/views/company-types/CompanyTypesDelete'

const CompanyTypes = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.companyType.modalOpen)
  const modalMode = useSelector((state: RootState) => state.companyType.modalMode)
  const id = useSelector((state: RootState) => state.companyType.id)

  useEffect(() => {
    dispatch(companyTypeActions.closeModal?.())
    dispatch(companyTypeActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <CompanyTypesFilters />
            </CardContent>

            <CardContent>
              <CompanyTypesTable />
            </CardContent>

            <CompanyTypesModal
              open={modalOpen}
              mode={modalMode}
              companyTypeId={id}
              onClose={() =>
                dispatch(
                  companyTypeActions.closeModal?.() ?? {
                    type: 'company-types/closeModal'
                  }
                )
              }
            />

            <CompanyTypesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default CompanyTypes
