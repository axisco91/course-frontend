import { Card, CardContent } from '@mui/material'
import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  getAdvisors,
  getCnaes,
  getCollaborators,
  getCompanyActivities,
  getCompanyTypes,
  getIncidenceTypes,
  getPopulations,
  getProvinces,
  getUsers
} from 'src/api/api'
import { AuthContext } from 'src/context/AuthContext'
import useHasPermission from 'src/context/hasPermission'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { companyActivityActions } from 'src/reducers/company/CompanyActivityReducer'
import { companyTypeActions } from 'src/reducers/company/CompanyTypeReducer'
import { incidenceTypeActions } from 'src/reducers/company/IncidenceTypeReducer'
import { providerActions } from 'src/reducers/company/ProviderReducer'
import { cnaeActions } from 'src/reducers/general/CnaeReducer'
import { populationActions } from 'src/reducers/general/PopulationReducer'
import { provinceActions } from 'src/reducers/general/ProvinceReducer'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { RootState } from 'src/reducers/types/types'
import { collaboratorActions } from 'src/reducers/users/CollaboratorReducer'
import { userActions } from 'src/reducers/users/UserReducer'
import Permission from 'src/views/components/Permission'
import TrainingActionsModal from 'src/views/training-actions/TrainingActionsModal'
import ProvidersDelete from 'src/views/providers/ProvidersDelete'
import ProvidersFilters from 'src/views/providers/ProvidersFilters'
import ProvidersModal from 'src/views/providers/ProvidersModal'
import ProvidersTable from 'src/views/providers/ProvidersTable'

const Providers = () => {
  const hasPermission = useHasPermission(['read.management'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => state.provider.modalOpen)
  const modalMode = useSelector((state: RootState) => state.provider.modalMode)
  const providerId = useSelector((state: RootState) => state.provider.id)

  const trainingActionModalOpen = useSelector((state: RootState) => state.trainingAction.modalOpen)
  const trainingActionModalMode = useSelector((state: RootState) => state.trainingAction.modalMode)
  const trainingActionId = useSelector((state: RootState) => state.trainingAction.id)

  useEffect(() => {
    dispatch(providerActions.closeProviderModal())
    dispatch(providerActions.setId(null))
    dispatch(trainingActionActions.closeTrainingActionModal())
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [
          companyActivitiesRes,
          companyTypesRes,
          cnaesRes,
          usersRes,
          incidenceTypesRes,
          advisorsRes,
          collaboratorsRes,
          provincesRes,
          populationsRes
        ] = await Promise.all([
          getCompanyActivities(),
          getCompanyTypes(),
          getCnaes(),
          getUsers(),
          getIncidenceTypes(),
          getAdvisors({ show_inactive: 'false' }),
          getCollaborators(),
          getProvinces(),
          getPopulations()
        ])

        if (cancelled) return

        dispatch(companyActivityActions.setCompanyActivities(companyActivitiesRes.data?.data?.company_activities ?? []))
        dispatch(companyTypeActions.setCompanyTypes(companyTypesRes.data?.data?.company_types ?? []))
        dispatch(cnaeActions.setCnaes(cnaesRes.data?.data?.cnaes ?? []))
        dispatch(userActions.setUsers(usersRes.data?.data?.users ?? usersRes.data ?? []))
        dispatch(incidenceTypeActions.setIncidenceTypes(incidenceTypesRes.data?.data?.incidence_types ?? []))
        dispatch(advisorActions.setAdvisors(advisorsRes.data?.data?.advisors ?? []))
        dispatch(collaboratorActions.setCollaborators(collaboratorsRes.data?.data?.collaborators ?? []))
        dispatch(provinceActions.setProvinces(provincesRes.data?.data?.provinces ?? []))
        dispatch(populationActions.setPopulations(populationsRes.data?.data?.populations ?? []))
      } catch (error) {
        if (!cancelled) {
          handleError(error, logout)
        }
      } finally {
        if (!cancelled) {
          setShow(true)
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, hasPermission])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <ProvidersFilters />
              </CardContent>

              <CardContent>
                <ProvidersTable />
              </CardContent>

              <ProvidersModal
                open={modalOpen}
                mode={modalMode}
                providerId={providerId}
                onClose={() => dispatch(providerActions.closeProviderModal())}
              />

              <TrainingActionsModal
                open={trainingActionModalOpen}
                mode={trainingActionModalMode}
                trainingActionId={trainingActionId}
                onClose={() => dispatch(trainingActionActions.closeTrainingActionModal())}
              />

              <ProvidersDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Providers
