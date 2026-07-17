// Courses.tsx
import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'

// ✅ API calls

// ✅ views
import CoursesFilters from 'src/views/courses/CoursesFilters'
import CoursesTable from 'src/views/courses/CoursesTable'
import CoursesModal from 'src/views/courses/CoursesModal'
import CoursesDelete from 'src/views/courses/CoursesDelete'
import TrainingActionsModal from 'src/views/training-actions/TrainingActionsModal'
import CompaniesModal from 'src/views/companies/CompaniesModal'
import AdvisorsModal from 'src/views/advisors/AdvisorsModal'

// ✅ reducers (replace names if yours are different)
import { courseActions } from 'src/reducers/courses/CourseReducer'
import {
  getAdvisors,
  getCenters,
  getCnaes,
  getCollaborators,
  getCompanies,
  getCompanyActivities,
  getCompanyTypes,
  getCourseOrigins,
  getCourseStatuses,
  getCourseTypes,
  getModalities,
  getPopulations,
  getProfessionalAreas,
  getProfessionalFamilies,
  getProvinces,
  getProviders,
  getStudents,
  getTeachers,
  getTrainingActions,
  getWebPlatforms
} from 'src/api/api'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { provinceActions } from 'src/reducers/general/ProvinceReducer'
import StudentModal from 'src/views/students/StudentsModal'
import { studentActions } from 'src/reducers/students/StudentReducer'
import { courseTypeActions } from 'src/reducers/courses/CourseTypeReducer'
import { courseStatusActions } from 'src/reducers/courses/CourseStatusReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { modalityActions } from 'src/reducers/general/ModalityReducer'
import { professionalAreaActions } from 'src/reducers/general/ProfessionalAreaReducer'
import { professionalFamilyActions } from 'src/reducers/general/ProfessionalFamilyReducer'
import { providerActions } from 'src/reducers/company/ProviderReducer'
import { courseOriginActions } from 'src/reducers/courses/CourseOriginReducer'
import { webPlatformActions } from 'src/reducers/trainingActions/WebPlatformReducer'
import RegistrationModal from 'src/views/courses/Registrationmodal'
import { registrationActions } from 'src/reducers/courses/RegistrationReducer'
import RegistrationDelete from 'src/views/courses/RegistrationDelete'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { collaboratorActions } from 'src/reducers/users/CollaboratorReducer'
import { companyActivityActions } from 'src/reducers/company/CompanyActivityReducer'
import { companyTypeActions } from 'src/reducers/company/CompanyTypeReducer'
import { cnaeActions } from 'src/reducers/general/CnaeReducer'
import { populationActions } from 'src/reducers/general/PopulationReducer'
import TracingsModal from 'src/views/tracings/TracingsModal'
import TracingsDelete from 'src/views/tracings/TracingsDelete'
import { tracingActions } from 'src/reducers/tracings/TracingReducer'

const Courses = () => {
  const hasPermission = useHasPermission(['read.courses'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => state.course.modalOpen)
  const modalMode = useSelector((state: RootState) => state.course.modalMode)
  const courseId = useSelector((state: RootState) => state.course.id)
  const studentModalOpen = useSelector((state: RootState) => state.student.modalOpen)
  const studentModalMode = useSelector((state: RootState) => state.student.modalMode)
  const studentId = useSelector((state: RootState) => state.student.id)
  const registrationModalOpen = useSelector((state: RootState) => state.registration.modalOpen)
  const registrationModalMode = useSelector((state: RootState) => state.registration.modalMode)
  const registrationId = useSelector((state: RootState) => state.registration.id)
  const trainingActionModalOpen = useSelector((state: RootState) => state.trainingAction.modalOpen)
  const trainingActionModalMode = useSelector((state: RootState) => state.trainingAction.modalMode)
  const trainingActionId = useSelector((state: RootState) => state.trainingAction.id)
  const companyModalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const companyModalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)
  const advisorModalOpen = useSelector((state: RootState) => state.advisor.modalOpen)
  const advisorModalMode = useSelector((state: RootState) => state.advisor.modalMode)
  const advisorId = useSelector((state: RootState) => state.advisor.id)
  const tracingModalOpen = useSelector((state: RootState) => state.tracing.modalOpen)
  const tracingModalMode = useSelector((state: RootState) => state.tracing.modalMode)
  const tracingId = useSelector((state: RootState) => state.tracing.id)

  // ✅ reset UI when entering the page
  useEffect(() => {
    dispatch(courseActions.closeCourseModal())
    dispatch(courseActions.setId(null))
    dispatch(registrationActions.closeRegistrationModal())
    dispatch(registrationActions.setId(null))
    dispatch(studentActions.closeStudentModal())
    dispatch(studentActions.setId(null))
    dispatch(companyActions.closeCompanyModal())
    dispatch(companyActions.setId(null))
    dispatch(advisorActions.closeAdvisorModal())
    dispatch(advisorActions.setId(null))
    dispatch(trainingActionActions.closeTrainingActionModal())
    dispatch(trainingActionActions.setId(null))
    dispatch(tracingActions.closeTracingModal())
    dispatch(tracingActions.setId(null))
  }, [dispatch])

  // ✅ load master data: formative actions + formation centers (active=1)
  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [
          taRes,
          teachersRes,
          centersRes,
          courseTypesRes,
          courseStatusesRes,
          advisorsRes,
          collaboratorsRes,
          companyActivitiesRes,
          companyTypesRes,
          cnaesRes,
          populationsRes,
          companiesRes,
          studentsRes,
          modalitiesRes,
          professionalAreasRes,
          professionalFamiliesRes,
          provincesRes,
          providersRes,
          courseOriginsRes,
          webPlatformsRes
        ] =
          await Promise.all([
            getTrainingActions({}),
            getTeachers({ show_inactive: 'false' }),
            getCenters(),
            getCourseTypes(),
            getCourseStatuses(),
            getAdvisors({ show_inactive: 'false' }),
            getCollaborators({ show_inactive: 'false' }),
            getCompanyActivities(),
            getCompanyTypes(),
            getCnaes(),
            getPopulations(),
            getCompanies({ show_inactive: 'false' }),
            getStudents({ show_inactive: 'false' }),
            getModalities(),
            getProfessionalAreas(),
            getProfessionalFamilies(),
            getProvinces(),
            getProviders(),
            getCourseOrigins(),
            getWebPlatforms()
          ])

        if (cancelled) return

        // 🔁 Replace these action names with yours if they differ:
        dispatch(trainingActionActions.setTrainingActions(taRes.data.data.training_actions))
        dispatch(teacherActions.setTeachers(teachersRes.data.data.teachers))
        dispatch(centerActions.setCenters(centersRes.data.data.centers))
        dispatch(courseTypeActions.setCourseTypes(courseTypesRes.data.data.course_types))
        dispatch(courseStatusActions.setCourseStatuses(courseStatusesRes.data.data.course_statuses))
        dispatch(advisorActions.setAdvisors(advisorsRes.data.data.advisors))
        dispatch(collaboratorActions.setCollaborators(collaboratorsRes.data.data.collaborators))
        dispatch(companyActivityActions.setCompanyActivities(companyActivitiesRes.data.data.company_activities))
        dispatch(companyTypeActions.setCompanyTypes(companyTypesRes.data.data.company_types))
        dispatch(cnaeActions.setCnaes(cnaesRes.data.data.cnaes))
        dispatch(populationActions.setPopulations(populationsRes.data.data.populations))
        dispatch(companyActions.setCompanies(companiesRes.data.data.companies))
        dispatch(studentActions.setStudents(studentsRes.data.data.students))
        dispatch(modalityActions.setModalities(modalitiesRes.data.data.modalities))
        dispatch(professionalAreaActions.setProfessionalAreas(professionalAreasRes.data.data.professional_areas))
        dispatch(
          professionalFamilyActions.setProfessionalFamilies(professionalFamiliesRes.data.data.professional_families)
        )
        dispatch(provinceActions.setProvinces(provincesRes.data.data.provinces))
        dispatch(providerActions.setProviders(providersRes.data.data.providers))
        dispatch(courseOriginActions.setCourseOrigins(courseOriginsRes.data.data.course_origins))
        dispatch(webPlatformActions.setWebPlatforms(webPlatformsRes.data.data.web_platforms))
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
    <Permission requiredPermissions={['read.courses']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <CoursesFilters />
              </CardContent>

              <CardContent>
                <CoursesTable />
              </CardContent>

              <CoursesModal
                open={modalOpen}
                mode={modalMode}
                courseId={courseId}
                onClose={() => dispatch(courseActions.closeCourseModal())}
              />
              <StudentModal
                open={studentModalOpen}
                mode={studentModalMode}
                studentId={studentId}
                onClose={() => dispatch(studentActions.closeStudentModal())}
              />
              <TracingsModal
                open={tracingModalOpen}
                mode={tracingModalMode}
                tracingId={tracingId}
                onClose={() => dispatch(tracingActions.closeTracingModal())}
              />
              <CompaniesModal
                open={companyModalOpen}
                mode={companyModalMode}
                companyId={companyId}
                onClose={() => dispatch(companyActions.closeCompanyModal())}
              />
              <AdvisorsModal
                open={advisorModalOpen}
                mode={advisorModalMode}
                advisorId={advisorId}
                onClose={() => dispatch(advisorActions.closeAdvisorModal())}
              />
              <RegistrationModal
                open={registrationModalOpen}
                mode={registrationModalMode}
                registrationId={registrationId}
                courseId={courseId}
                onClose={() => dispatch(registrationActions.closeRegistrationModal())}
              />
              <CoursesDelete />
              <RegistrationDelete />
              <TracingsDelete />
              <TrainingActionsModal
                open={trainingActionModalOpen}
                mode={trainingActionModalMode}
                trainingActionId={trainingActionId}
                onClose={() => dispatch(trainingActionActions.closeTrainingActionModal())}
              />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Courses
