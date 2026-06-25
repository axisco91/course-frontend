// Profits.tsx
import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'

// ✅ views
import ProfitsFilters from 'src/views/profits/ProfitsFilters'
import ProfitsModal from 'src/views/profits/ProfitsModal'

// ✅ reducers
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
  getStudents,
  getTeachers,
  getTrainingActions
} from 'src/api/api'

// ✅ student modal
import StudentModal from 'src/views/students/StudentsModal'
import { profitActions } from 'src/reducers/profits/ProfitReducer'
import ProfitsTable from 'src/views/profits/ProfitsTable'
import ProfitsDelete from 'src/views/profits/ProfitsDelete'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import CompaniesModal from 'src/views/companies/CompaniesModal'
import CoursesModal from 'src/views/courses/CoursesModal'
import AdvisorsModal from 'src/views/advisors/AdvisorsModal'
import TrainingActionsModal from 'src/views/training-actions/TrainingActionsModal'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { collaboratorActions } from 'src/reducers/users/CollaboratorReducer'
import RegistrationModal from 'src/views/courses/Registrationmodal'
import { registrationActions } from 'src/reducers/courses/RegistrationReducer'
import RegistrationDelete from 'src/views/courses/RegistrationDelete'

const Profits = () => {
  const hasPermission = useHasPermission(['read.profits'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => state.profit.modalOpen)
  const modalMode = useSelector((state: RootState) => state.profit.modalMode)
  const profitId = useSelector((state: RootState) => state.profit.id)

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
    dispatch(profitActions.closeProfitModal?.() ?? { type: 'profit/closeProfitModal' })
    dispatch(profitActions.setId?.(null) ?? { type: 'profit/setId', payload: null })

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
        const [taRes, teachersRes, centersRes, companiesRes, coursesRes, studentsRes, advisorsRes, collaboratorsRes] =
          await Promise.all([
            getTrainingActions({}),
            getTeachers({ show_inactive: 'false' }),
            getCenters(),
            getCompanies({ show_inactive: 'false' }),
            getCourses(),
            getStudents({ show_inactive: 'false' }),
            getAdvisors({ show_inactive: 'false' }),
            getCollaborators({ show_inactive: 'false' })
          ])

        if (cancelled) return

        dispatch(trainingActionActions.setTrainingActions?.(taRes.data?.data?.training_actions ?? []))

        dispatch(teacherActions.setTeachers?.(teachersRes.data?.data?.teachers ?? []))

        dispatch(centerActions.setCenters?.(centersRes.data?.data?.centers ?? []))
        dispatch(companyActions.setCompanies?.(companiesRes.data?.data?.companies ?? []))
        dispatch(courseActions.setCourses?.(coursesRes.data?.data?.courses ?? []))
        dispatch(studentActions.setStudents?.(studentsRes.data?.data?.students ?? []))
        dispatch(advisorActions.setAdvisors?.(advisorsRes.data?.data?.advisors ?? []))
        dispatch(collaboratorActions.setCollaborators?.(collaboratorsRes.data?.data?.collaborators ?? []))
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
    <Permission requiredPermissions={['read.profits']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <ProfitsFilters />
              </CardContent>

              <CardContent>
                <ProfitsTable />
              </CardContent>

              <ProfitsModal
                open={modalOpen}
                mode={modalMode}
                profitId={profitId}
                onClose={() => dispatch(profitActions.closeProfitModal?.() ?? { type: 'profit/closeProfitModal' })}
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

              <ProfitsDelete />
              <RegistrationDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Profits
