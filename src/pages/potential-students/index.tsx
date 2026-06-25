import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'
import PotentialStudentsFilters from 'src/views/potential-students/PotentialStudentsFilters'
import PotentialStudentsTable from 'src/views/potential-students/PotentialStudentsTable'
import PotentialStudentsDelete from 'src/views/potential-students/PotentialStudentsDelete'
import PotentialStudentsModal from 'src/views/potential-students/PotentialStudentsModal'
import PotentialStudentSendEmailModal from 'src/views/potential-students/PotentialStudentSendEmailModal'
import PotentialStudentSendBonusEmailModal from 'src/views/potential-students/PotentialStudentSendBonusEmailModal'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { potentialStudentActions } from 'src/reducers/students/PotentialStudentReducer'
import { getCompanies } from 'src/api/api'
import CompaniesModal from 'src/views/companies/CompaniesModal'

const PotentialStudents = () => {
  const hasPermission = useHasPermission(['read.potential_students'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => (state.potentialStudent as any).modalOpen)
  const modalMode = useSelector((state: RootState) => (state.potentialStudent as any).modalMode)
  const potentialStudentId = useSelector((state: RootState) => (state.potentialStudent as any).id)
  const companyModalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const companyModalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)

  useEffect(() => {
    dispatch(potentialStudentActions.closeModal())
    dispatch(potentialStudentActions.setId(null))
    dispatch(companyActions.closeCompanyModal())
    dispatch(companyActions.setId(null))
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const companiesRes = await getCompanies({ show_inactive: 'false' })
        if (cancelled) return

        dispatch(companyActions.setCompanies?.(companiesRes.data?.data?.companies ?? []))
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
    <Permission requiredPermissions={['read.potential_students']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <PotentialStudentsFilters />
              </CardContent>

              <CardContent>
                <PotentialStudentsTable />
              </CardContent>

              <PotentialStudentsModal
                open={Boolean(modalOpen)}
                mode={(modalMode ?? 'view') as any}
                potentialStudentId={potentialStudentId}
                onClose={() => dispatch(potentialStudentActions.closeModal())}
              />
              <CompaniesModal
                open={companyModalOpen}
                mode={companyModalMode}
                companyId={companyId}
                onClose={() => dispatch(companyActions.closeCompanyModal())}
              />

              <PotentialStudentsDelete />
              <PotentialStudentSendEmailModal />
              <PotentialStudentSendBonusEmailModal />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default PotentialStudents
