import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'
import PotentialCompaniesFilters from 'src/views/potential-companies/PotentialCompaniesFilters'
import PotentialCompaniesTable from 'src/views/potential-companies/PotentialCompaniesTable'
import PotentialCompaniesDelete from 'src/views/potential-companies/PotentialCompaniesDelete'
import PotentialCompaniesModal from 'src/views/potential-companies/PotentialCompaniesModal'
import SendEmailModal from 'src/views/potential-companies/SendEmailModal'
import { potentialCompanyActions } from 'src/reducers/company/PotentialCompanyReducer'
import {
  getAdvisors,
  getCnaes,
  getCollaborators,
  getCompanyActivities,
  getCompanyTypes,
  getPopulations,
  getProvinces
} from 'src/api/api'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { cnaeActions } from 'src/reducers/general/CnaeReducer'
import { collaboratorActions } from 'src/reducers/users/CollaboratorReducer'
import { companyActivityActions } from 'src/reducers/company/CompanyActivityReducer'
import { companyTypeActions } from 'src/reducers/company/CompanyTypeReducer'
import { populationActions } from 'src/reducers/general/PopulationReducer'
import { provinceActions } from 'src/reducers/general/ProvinceReducer'

const PotentialCompanies = () => {
  const hasPermission = useHasPermission(['read.potential_companies'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => (state.potentialCompany as any).modalOpen)
  const modalMode = useSelector((state: RootState) => (state.potentialCompany as any).modalMode)
  const potentialCompanyId = useSelector((state: RootState) => (state.potentialCompany as any).id)

  useEffect(() => {
    dispatch(potentialCompanyActions.closePotentialCompanyModal())
    dispatch(potentialCompanyActions.setId(null))
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [typesRes, activitiesRes, advisorsRes, provincesRes, collaboratorsRes, cnaesRes, populationsRes] =
          await Promise.all([
            getCompanyTypes(),
            getCompanyActivities(),
            getAdvisors({ show_inactive: 'false' }),
            getProvinces(),
            getCollaborators({ show_inactive: 'false' }),
            getCnaes(),
            getPopulations()
          ])

        if (cancelled) return

        dispatch(companyTypeActions.setCompanyTypes(typesRes.data?.data?.company_types ?? []))
        dispatch(companyActivityActions.setCompanyActivities(activitiesRes.data?.data?.company_activities ?? []))
        dispatch(advisorActions.setAdvisors(advisorsRes.data?.data?.advisors ?? []))
        dispatch(provinceActions.setProvinces(provincesRes.data?.data?.provinces ?? []))
        dispatch(collaboratorActions.setCollaborators(collaboratorsRes.data?.data?.collaborators ?? []))
        dispatch(cnaeActions.setCnaes(cnaesRes.data?.data?.cnaes ?? []))
        dispatch(populationActions.setPopulations(populationsRes.data?.data?.populations ?? []))
      } catch (error) {
        if (!cancelled) handleError(error, logout)
      } finally {
        if (!cancelled) setShow(true)
      }
    }

    if (hasPermission) {
      fetchGeneralData()
    } else {
      setShow(true)
    }

    return () => {
      cancelled = true
    }
  }, [hasPermission, dispatch, handleError, logout])

  return (
    <Permission requiredPermissions={['read.potential_companies']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <PotentialCompaniesFilters />
              </CardContent>

              <CardContent>
                <PotentialCompaniesTable />
              </CardContent>

              <PotentialCompaniesModal
                open={Boolean(modalOpen)}
                mode={(modalMode ?? 'view') as any}
                potentialCompanyId={potentialCompanyId}
                onClose={() => dispatch(potentialCompanyActions.closePotentialCompanyModal())}
              />

              <PotentialCompaniesDelete />
              <SendEmailModal />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default PotentialCompanies
