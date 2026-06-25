// TrainingActions.tsx
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
import TrainingActionsFilters from 'src/views/training-actions/TrainingActionsFilters'
import TrainingActionsTable from 'src/views/training-actions/TrainingActionsTable'
import TrainingActionsModal from 'src/views/training-actions/TrainingActionsModal'
import TrainingActionsDelete from 'src/views/training-actions/TrainingActionsDelete'
import CoursesModal from 'src/views/courses/CoursesModal'
import RegistrationModal from 'src/views/courses/Registrationmodal'
import RegistrationDelete from 'src/views/courses/RegistrationDelete'
import StudentModal from 'src/views/students/StudentsModal'
import CompaniesModal from 'src/views/companies/CompaniesModal'
import AdvisorsModal from 'src/views/advisors/AdvisorsModal'

// ✅ reducer
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { registrationActions } from 'src/reducers/courses/RegistrationReducer'
import { studentActions } from 'src/reducers/students/StudentReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { collaboratorActions } from 'src/reducers/users/CollaboratorReducer'

// ✅ API (carga listas que necesites en el modal)
import {
  getAdvisors,
  getCenters,
  getCollaborators,
  getCompanies,
  getCourseOrigins,
  getModalities,
  getProfessionalAreas,
  getProfessionalFamilies,
  getPopulations,
  getProviders,
  getProvinces,
  getStudents,
  getTeachers,
  getTrainingActions,
  getWebPlatforms
} from 'src/api/api'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { provinceActions } from 'src/reducers/general/ProvinceReducer'
import { professionalAreaActions } from 'src/reducers/general/ProfessionalAreaReducer'
import { professionalFamilyActions } from 'src/reducers/general/ProfessionalFamilyReducer'
import { populationActions } from 'src/reducers/general/PopulationReducer'
import { modalityActions } from 'src/reducers/general/ModalityReducer'
import { providerActions } from 'src/reducers/company/ProviderReducer'
import { courseOriginActions } from 'src/reducers/courses/CourseOriginReducer'
import { webPlatformActions } from 'src/reducers/trainingActions/WebPlatformReducer'

const TrainingActions = () => {
  const hasPermission = useHasPermission(['read.training_actions'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  // ✅ modal state
  const modalOpen = useSelector((state: RootState) => state.trainingAction.modalOpen)
  const modalMode = useSelector((state: RootState) => state.trainingAction.modalMode)
  const trainingActionId = useSelector((state: RootState) => state.trainingAction.id)
  const courseModalOpen = useSelector((state: RootState) => state.course.modalOpen)
  const courseModalMode = useSelector((state: RootState) => state.course.modalMode)
  const courseId = useSelector((state: RootState) => state.course.id)
  const registrationModalOpen = useSelector((state: RootState) => state.registration.modalOpen)
  const registrationModalMode = useSelector((state: RootState) => state.registration.modalMode)
  const registrationId = useSelector((state: RootState) => state.registration.id)
  const studentModalOpen = useSelector((state: RootState) => state.student.modalOpen)
  const studentModalMode = useSelector((state: RootState) => state.student.modalMode)
  const studentId = useSelector((state: RootState) => state.student.id)
  const companyModalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const companyModalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)
  const advisorModalOpen = useSelector((state: RootState) => state.advisor.modalOpen)
  const advisorModalMode = useSelector((state: RootState) => state.advisor.modalMode)
  const advisorId = useSelector((state: RootState) => state.advisor.id)

  // ✅ reset UI when entering the page
  useEffect(() => {
    // ajusta nombres si tu slice usa otros
    dispatch(trainingActionActions.closeTrainingActionModal())
    dispatch(trainingActionActions.setId(null))
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
  }, [dispatch])

  // ✅ preload master data (solo si tu TrainingActionsModal lo necesita)
  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [
          teachersRes,
          centersRes,
          provincesRes,
          professionalAreasRes,
          professionalFamiliesRes,
          modalitiesRes,
          providersRes,
          courseOriginsRes,
          webPlatformRes,
          trainingActionsRes,
          studentsRes,
          companiesRes,
          advisorsRes,
          collaboratorsRes,
          populationsRes
        ] = await Promise.all([
          getTeachers({ active: 1 }),
          getCenters(),
          getProvinces(),
          getProfessionalAreas(),
          getProfessionalFamilies(),
          getModalities(),
          getProviders(),
          getCourseOrigins(),
          getWebPlatforms(),
          getTrainingActions({}),
          getStudents({ show_inactive: 'false' }),
          getCompanies({ show_inactive: 'false' }),
          getAdvisors({ show_inactive: 'false' }),
          getCollaborators({ show_inactive: 'false' }),
          getPopulations()
        ])

        if (cancelled) return

        dispatch(teacherActions.setTeachers(teachersRes.data.data.teachers))
        dispatch(centerActions.setCenters(centersRes.data.data.centers))
        dispatch(provinceActions.setProvinces(provincesRes.data.data.provinces))
        dispatch(professionalAreaActions.setProfessionalAreas(professionalAreasRes.data.data.professional_areas))
        dispatch(
          professionalFamilyActions.setProfessionalFamilies(professionalFamiliesRes.data.data.professional_families)
        )
        dispatch(modalityActions.setModalities(modalitiesRes.data.data.modalities))
        dispatch(providerActions.setProviders(providersRes.data.data.providers))
        dispatch(courseOriginActions.setCourseOrigins(courseOriginsRes.data.data.course_origins))
        dispatch(webPlatformActions.setWebPlatforms(webPlatformRes.data.data.web_platforms))
        dispatch(trainingActionActions.setTrainingActions(trainingActionsRes.data.data.training_actions))
        dispatch(studentActions.setStudents(studentsRes.data.data.students))
        dispatch(companyActions.setCompanies(companiesRes.data.data.companies))
        dispatch(advisorActions.setAdvisors(advisorsRes.data.data.advisors))
        dispatch(collaboratorActions.setCollaborators(collaboratorsRes.data.data.collaborators))
        dispatch(populationActions.setPopulations(populationsRes.data.data.populations))
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
    <Permission requiredPermissions={['read.training_actions']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <TrainingActionsFilters />
              </CardContent>

              <CardContent>
                <TrainingActionsTable />
              </CardContent>

              <TrainingActionsModal
                open={modalOpen}
                mode={modalMode}
                trainingActionId={trainingActionId}
                onClose={() => dispatch(trainingActionActions.closeTrainingActionModal())}
              />
              <CoursesModal
                open={courseModalOpen}
                mode={courseModalMode}
                courseId={courseId}
                onClose={() => dispatch(courseActions.closeCourseModal())}
              />
              <RegistrationModal
                open={registrationModalOpen}
                mode={registrationModalMode}
                registrationId={registrationId}
                courseId={courseId}
                onClose={() => dispatch(registrationActions.closeRegistrationModal())}
              />
              <StudentModal
                open={studentModalOpen}
                mode={studentModalMode}
                studentId={studentId}
                onClose={() => dispatch(studentActions.closeStudentModal())}
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

              <TrainingActionsDelete />
              <RegistrationDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default TrainingActions
