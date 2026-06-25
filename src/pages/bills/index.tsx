// Bills.tsx
import Grid from '@mui/material/Grid'
import { Fragment, useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'

// ✅ views
import BillsFilters from 'src/views/bills/BillsFilters'
import BillsTable from 'src/views/bills/BillsTable'
import BillsModal from 'src/views/bills/BillsModal'
import BillsDelete from 'src/views/bills/BillsDelete'

// ✅ reducers
import { billActions } from 'src/reducers/bills/BillReducer'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { studentActions } from 'src/reducers/students/StudentReducer'

// ✅ API
import {
  getAdvisors,
  getCenters,
  getCollaborators,
  getCompanies,
  getCourses,
  getTeachers,
  getTrainingActions
} from 'src/api/api'

// ✅ student modal
import StudentModal from 'src/views/students/StudentsModal'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { collaboratorActions } from 'src/reducers/users/CollaboratorReducer'
import TrainingContractBillsTable from 'src/views/bills/TrainingContractBillsTable'
import TrainingContractBillsFilters from 'src/views/bills/TrainingContractBillsFilters'
import CompaniesModal from 'src/views/companies/CompaniesModal'
import CoursesModal from 'src/views/courses/CoursesModal'
import AdvisorsModal from 'src/views/advisors/AdvisorsModal'
import TrainingActionsModal from 'src/views/training-actions/TrainingActionsModal'
import RegistrationModal from 'src/views/courses/Registrationmodal'
import RegistrationDelete from 'src/views/courses/RegistrationDelete'
import { registrationActions } from 'src/reducers/courses/RegistrationReducer'
import TrainingContractBillsDelete from 'src/views/bills/TrainingContractBillsDelete'

const Bills = () => {
  const hasPermission = useHasPermission(['read.bills'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => state.bill.modalOpen)
  const modalMode = useSelector((state: RootState) => state.bill.modalMode)
  const showTable = useSelector((state: RootState) => state.bill.showTable)
  const billId = useSelector((state: RootState) => state.bill.id)

  const studentModalOpen = useSelector((state: RootState) => state.student.modalOpen)
  const studentModalMode = useSelector((state: RootState) => state.student.modalMode)
  const studentId = useSelector((state: RootState) => state.student.id)
  const companyModalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const companyModalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)
  const courseModalOpen = useSelector((state: RootState) => state.course.modalOpen)
  const courseModalMode = useSelector((state: RootState) => state.course.modalMode)
  const courseId = useSelector((state: RootState) => state.course.id)
  const advisorModalOpen = useSelector((state: RootState) => state.advisor.modalOpen)
  const advisorModalMode = useSelector((state: RootState) => state.advisor.modalMode)
  const advisorId = useSelector((state: RootState) => state.advisor.id)
  const trainingActionModalOpen = useSelector((state: RootState) => state.trainingAction.modalOpen)
  const trainingActionModalMode = useSelector((state: RootState) => state.trainingAction.modalMode)
  const trainingActionId = useSelector((state: RootState) => state.trainingAction.id)
  const registrationModalOpen = useSelector((state: RootState) => state.registration.modalOpen)
  const registrationModalMode = useSelector((state: RootState) => state.registration.modalMode)
  const registrationId = useSelector((state: RootState) => state.registration.id)

  // ✅ reset UI when entering the page
  useEffect(() => {
    dispatch(billActions.closeBillModal?.() ?? { type: 'bill/closeBillModal' })
    dispatch(billActions.setId?.(null) ?? { type: 'bill/setId', payload: null })

    dispatch(studentActions.closeStudentModal?.() ?? { type: 'student/closeStudentModal' })
    dispatch(studentActions.setId?.(null) ?? { type: 'student/setId', payload: null })

    dispatch(companyActions.closeCompanyModal())
    dispatch(companyActions.setId(null))

    dispatch(courseActions.closeCourseModal())
    dispatch(courseActions.setId(null))

    dispatch(advisorActions.closeAdvisorModal())
    dispatch(advisorActions.setId(null))

    dispatch(trainingActionActions.closeTrainingActionModal())
    dispatch(trainingActionActions.setId(null))

    dispatch(registrationActions.closeRegistrationModal())
    dispatch(registrationActions.setId(null))
  }, [dispatch])

  // ✅ load master data
  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [taRes, teachersRes, centersRes, companiesRes, coursesRes, advisorsRes, collaboratorRes] =
          await Promise.all([
            getTrainingActions({}),
            getTeachers({ show_inactive: 'false' }),
            getCenters(),
            getCompanies({ show_inactive: 'false' }),
            getCourses(),
            getAdvisors({ show_inactive: 'false' }),
            getCollaborators({ show_inactive: 'false' })
          ])

        if (cancelled) return

        dispatch(trainingActionActions.setTrainingActions?.(taRes.data?.data?.training_actions ?? []))

        dispatch(teacherActions.setTeachers?.(teachersRes.data?.data?.teachers ?? []))

        dispatch(centerActions.setCenters?.(centersRes.data?.data?.centers ?? []))
        dispatch(companyActions.setCompanies?.(companiesRes.data?.data?.companies ?? []))
        dispatch(courseActions.setCourses?.(coursesRes.data?.data?.courses ?? []))
        dispatch(advisorActions.setAdvisors?.(advisorsRes.data?.data?.advisors ?? []))
        dispatch(collaboratorActions.setCollaborators?.(collaboratorRes.data?.data?.collaborators ?? []))
      } catch (error) {
        if (!cancelled) handleError(error, logout)
      } finally {
        if (!cancelled) setShow(true)
      }
    }

    if (hasPermission) fetchGeneralData()
    else setShow(true)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, dispatch])

  return (
    <Permission requiredPermissions={['read.bills']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              {showTable ? (
                <Fragment>
                  <CardContent>
                    <BillsFilters />
                  </CardContent>

                  <CardContent>
                    <BillsTable />
                  </CardContent>
                </Fragment>
              ) : (
                <Fragment>
                  <CardContent>
                    <TrainingContractBillsFilters />
                  </CardContent>

                  <CardContent>
                    <TrainingContractBillsTable />
                  </CardContent>
                </Fragment>
              )}

              <BillsModal
                open={modalOpen}
                mode={modalMode}
                billId={billId}
                onClose={() => dispatch(billActions.closeBillModal?.() ?? { type: 'bill/closeBillModal' })}
              />

              <StudentModal
                open={studentModalOpen}
                mode={studentModalMode}
                studentId={studentId}
                onClose={() => dispatch(studentActions.closeStudentModal?.() ?? { type: 'student/closeStudentModal' })}
              />
              <CompaniesModal
                open={companyModalOpen}
                mode={companyModalMode}
                companyId={companyId}
                onClose={() => dispatch(companyActions.closeCompanyModal())}
              />
              <CoursesModal
                open={courseModalOpen}
                mode={courseModalMode}
                courseId={courseId}
                onClose={() => dispatch(courseActions.closeCourseModal())}
              />
              <AdvisorsModal
                open={advisorModalOpen}
                mode={advisorModalMode}
                advisorId={advisorId}
                onClose={() => dispatch(advisorActions.closeAdvisorModal())}
              />
              <TrainingActionsModal
                open={trainingActionModalOpen}
                mode={trainingActionModalMode}
                trainingActionId={trainingActionId}
                onClose={() => dispatch(trainingActionActions.closeTrainingActionModal())}
              />
              <RegistrationModal
                open={registrationModalOpen}
                mode={registrationModalMode}
                registrationId={registrationId}
                courseId={courseId}
                onClose={() => dispatch(registrationActions.closeRegistrationModal())}
              />

              <BillsDelete />
              <TrainingContractBillsDelete />
              <RegistrationDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Bills
