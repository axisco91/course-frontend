// Tracings.tsx
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
import TracingsFilters from 'src/views/tracings/TracingsFilters'
import TracingsTable from 'src/views/tracings/TracingsTable'
import TracingsModal from 'src/views/tracings/TracingsModal'
import TracingsDelete from 'src/views/tracings/TracingsDelete'

// ✅ reducers
import { tracingActions } from 'src/reducers/tracings/TracingReducer'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { studentActions } from 'src/reducers/students/StudentReducer'

// ✅ API
import {
  getAdvisors,
  getCenters,
  getCnaes,
  getCollaborators,
  getCompanies,
  getCompanyActivities,
  getCompanyTypes,
  getCourses,
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

// ✅ student modal
import StudentModal from 'src/views/students/StudentsModal'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { courseStatusActions } from 'src/reducers/courses/CourseStatusReducer'
import { courseTypeActions } from 'src/reducers/courses/CourseTypeReducer'
import CompaniesModal from 'src/views/companies/CompaniesModal'
import CoursesModal from 'src/views/courses/CoursesModal'
import TrainingActionsModal from 'src/views/training-actions/TrainingActionsModal'
import AdvisorsModal from 'src/views/advisors/AdvisorsModal'
import RegistrationModal from 'src/views/courses/Registrationmodal'
import RegistrationDelete from 'src/views/courses/RegistrationDelete'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { collaboratorActions } from 'src/reducers/users/CollaboratorReducer'
import { companyActivityActions } from 'src/reducers/company/CompanyActivityReducer'
import { companyTypeActions } from 'src/reducers/company/CompanyTypeReducer'
import { cnaeActions } from 'src/reducers/general/CnaeReducer'
import { populationActions } from 'src/reducers/general/PopulationReducer'
import { provinceActions } from 'src/reducers/general/ProvinceReducer'
import { modalityActions } from 'src/reducers/general/ModalityReducer'
import { professionalAreaActions } from 'src/reducers/general/ProfessionalAreaReducer'
import { professionalFamilyActions } from 'src/reducers/general/ProfessionalFamilyReducer'
import { providerActions } from 'src/reducers/company/ProviderReducer'
import { courseOriginActions } from 'src/reducers/courses/CourseOriginReducer'
import { webPlatformActions } from 'src/reducers/trainingActions/WebPlatformReducer'
import { registrationActions } from 'src/reducers/courses/RegistrationReducer'

const Tracings = () => {
  const hasPermission = useHasPermission(['read.tracings'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => state.tracing.modalOpen)
  const modalMode = useSelector((state: RootState) => state.tracing.modalMode)
  const tracingId = useSelector((state: RootState) => state.tracing.id)

  const studentModalOpen = useSelector((state: RootState) => state.student.modalOpen)
  const studentModalMode = useSelector((state: RootState) => state.student.modalMode)
  const studentId = useSelector((state: RootState) => state.student.id)
  const companyModalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const companyModalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)
  const courseModalOpen = useSelector((state: RootState) => state.course.modalOpen)
  const courseModalMode = useSelector((state: RootState) => state.course.modalMode)
  const courseId = useSelector((state: RootState) => state.course.id)
  const trainingActionModalOpen = useSelector((state: RootState) => state.trainingAction.modalOpen)
  const trainingActionModalMode = useSelector((state: RootState) => state.trainingAction.modalMode)
  const trainingActionId = useSelector((state: RootState) => state.trainingAction.id)
  const advisorModalOpen = useSelector((state: RootState) => state.advisor.modalOpen)
  const advisorModalMode = useSelector((state: RootState) => state.advisor.modalMode)
  const advisorId = useSelector((state: RootState) => state.advisor.id)
  const registrationModalOpen = useSelector((state: RootState) => state.registration.modalOpen)
  const registrationModalMode = useSelector((state: RootState) => state.registration.modalMode)
  const registrationId = useSelector((state: RootState) => state.registration.id)

  // ✅ reset UI when entering the page
  useEffect(() => {
    dispatch(tracingActions.closeTracingModal?.() ?? { type: 'tracing/closeTracingModal' })
    dispatch(tracingActions.setId?.(null) ?? { type: 'tracing/setId', payload: null })

    dispatch(studentActions.closeStudentModal?.() ?? { type: 'student/closeStudentModal' })
    dispatch(studentActions.setId?.(null) ?? { type: 'student/setId', payload: null })

    dispatch(companyActions.closeCompanyModal())
    dispatch(companyActions.setId(null))

    dispatch(courseActions.closeCourseModal())
    dispatch(courseActions.setId(null))

    dispatch(trainingActionActions.closeTrainingActionModal())
    dispatch(trainingActionActions.setId(null))

    dispatch(advisorActions.closeAdvisorModal())
    dispatch(advisorActions.setId(null))

    dispatch(registrationActions.closeRegistrationModal())
    dispatch(registrationActions.setId(null))
  }, [dispatch])

  // ✅ load master data
  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [
          taRes,
          teachersRes,
          centersRes,
          coursesRes,
          companiesRes,
          studentsRes,
          statusesRes,
          typesRes,
          advisorsRes,
          collaboratorsRes,
          companyActivitiesRes,
          companyTypesRes,
          cnaesRes,
          populationsRes,
          provincesRes,
          modalitiesRes,
          professionalAreasRes,
          professionalFamiliesRes,
          providersRes,
          courseOriginsRes,
          webPlatformsRes
        ] =
          await Promise.all([
            getTrainingActions({}),
            getTeachers({ show_inactive: 'false' }),
            getCenters(),
            getCourses(),
            getCompanies({ show_inactive: 'false' }),
            getStudents({ show_inactive: 'false' }),
            getCourseStatuses(),
            getCourseTypes(),
            getAdvisors({ show_inactive: 'false' }),
            getCollaborators({ show_inactive: 'false' }),
            getCompanyActivities(),
            getCompanyTypes(),
            getCnaes(),
            getPopulations(),
            getProvinces(),
            getModalities(),
            getProfessionalAreas(),
            getProfessionalFamilies(),
            getProviders(),
            getCourseOrigins(),
            getWebPlatforms()
          ])

        if (cancelled) return

        dispatch(
          trainingActionActions.setTrainingActions?.(taRes.data?.data?.training_actions ?? []) ?? {
            type: 'trainingAction/setTrainingActions',
            payload: taRes.data?.data?.training_actions ?? []
          }
        )

        dispatch(
          teacherActions.setTeachers?.(teachersRes.data?.data?.teachers ?? []) ?? {
            type: 'teacher/setTeachers',
            payload: teachersRes.data?.data?.teachers ?? []
          }
        )

        dispatch(
          centerActions.setCenters?.(centersRes.data?.data?.centers ?? []) ?? {
            type: 'center/setCenters',
            payload: centersRes.data?.data?.centers ?? []
          }
        )
        dispatch(studentActions.setStudents?.(studentsRes.data?.data?.students ?? []))
        dispatch(companyActions.setCompanies?.(companiesRes.data?.data?.companies ?? []))
        dispatch(courseActions.setCourses?.(coursesRes.data?.data?.courses ?? []))
        dispatch(courseStatusActions.setCourseStatuses?.(statusesRes.data?.data?.course_statuses ?? []))
        dispatch(courseTypeActions.setCourseTypes?.(typesRes.data?.data?.course_types ?? []))
        dispatch(advisorActions.setAdvisors?.(advisorsRes.data?.data?.advisors ?? []))
        dispatch(collaboratorActions.setCollaborators?.(collaboratorsRes.data?.data?.collaborators ?? []))
        dispatch(companyActivityActions.setCompanyActivities?.(companyActivitiesRes.data?.data?.company_activities ?? []))
        dispatch(companyTypeActions.setCompanyTypes?.(companyTypesRes.data?.data?.company_types ?? []))
        dispatch(cnaeActions.setCnaes?.(cnaesRes.data?.data?.cnaes ?? []))
        dispatch(populationActions.setPopulations?.(populationsRes.data?.data?.populations ?? []))
        dispatch(provinceActions.setProvinces?.(provincesRes.data?.data?.provinces ?? []))
        dispatch(modalityActions.setModalities?.(modalitiesRes.data?.data?.modalities ?? []))
        dispatch(
          professionalAreaActions.setProfessionalAreas?.(professionalAreasRes.data?.data?.professional_areas ?? [])
        )
        dispatch(
          professionalFamilyActions.setProfessionalFamilies?.(
            professionalFamiliesRes.data?.data?.professional_families ?? []
          )
        )
        dispatch(providerActions.setProviders?.(providersRes.data?.data?.providers ?? []))
        dispatch(courseOriginActions.setCourseOrigins?.(courseOriginsRes.data?.data?.course_origins ?? []))
        dispatch(webPlatformActions.setWebPlatforms?.(webPlatformsRes.data?.data?.web_platforms ?? []))
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
    <Permission requiredPermissions={['read.tracings']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <TracingsFilters />
              </CardContent>

              <CardContent>
                <TracingsTable />
              </CardContent>

              <TracingsModal
                open={modalOpen}
                mode={modalMode}
                tracingId={tracingId}
                onClose={() =>
                  dispatch(
                    tracingActions.closeTracingModal?.() ?? {
                      type: 'tracing/closeTracingModal'
                    }
                  )
                }
              />

              <StudentModal
                open={studentModalOpen}
                mode={studentModalMode}
                studentId={studentId}
                onClose={() =>
                  dispatch(
                    studentActions.closeStudentModal?.() ?? {
                      type: 'student/closeStudentModal'
                    }
                  )
                }
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
              <TrainingActionsModal
                open={trainingActionModalOpen}
                mode={trainingActionModalMode}
                trainingActionId={trainingActionId}
                onClose={() => dispatch(trainingActionActions.closeTrainingActionModal())}
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

              <TracingsDelete />
              <RegistrationDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Tracings
