import { Card, CardContent } from '@mui/material'
import Grid from '@mui/material/Grid'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mainCompanyActions } from 'src/reducers/management/MainCompanyReducer'
import { RootState } from 'src/reducers/types/types'
import Permission from 'src/views/components/Permission'
import MainCompaniesDelete from 'src/views/main-companies/MainCompaniesDelete'
import MainCompaniesFilters from 'src/views/main-companies/MainCompaniesFilters'
import MainCompaniesModal from 'src/views/main-companies/MainCompaniesModal'
import MainCompaniesTable from 'src/views/main-companies/MainCompaniesTable'

const MainCompanies = () => {
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => (state as any).mainCompany?.modalOpen)
  const modalMode = useSelector((state: RootState) => (state as any).mainCompany?.modalMode)
  const id = useSelector((state: RootState) => (state as any).mainCompany?.id)

  useEffect(() => {
    dispatch(mainCompanyActions.closeModal?.())
    dispatch(mainCompanyActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.main_companies']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <MainCompaniesFilters />
            </CardContent>

            <CardContent>
              <MainCompaniesTable />
            </CardContent>

            <MainCompaniesModal
              open={Boolean(modalOpen)}
              mode={String(modalMode ?? 'view') as 'view' | 'edit' | 'create'}
              mainCompanyId={id}
              onClose={() => dispatch(mainCompanyActions.closeModal())}
            />

            <MainCompaniesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default MainCompanies
