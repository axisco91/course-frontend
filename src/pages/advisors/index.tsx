// Advisors.tsx
import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'

// ✅ views (create these like Companies/Courses ones)
import AdvisorsFilters from 'src/views/advisors/AdvisorsFilters'
import AdvisorsTable from 'src/views/advisors/AdvisorsTable'
import AdvisorsModal from 'src/views/advisors/AdvisorsModal'
import AdvisorsDelete from 'src/views/advisors/AdvisorsDelete'

// ✅ reducer (adjust path/name to your project)
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'

// ✅ API (use your real endpoint name)
import {
  getAdvisors,
  getCenters,
  getCollaborators,
  getCommunitiesWithFestivals,
  getCompanies,
  getCompanyActivities,
  getCompanyTypes,
  getCourses,
  getCourseOrigins,
  getCourseStatuses,
  getCourseTypes,
  getModalities,
  getPopulations,
  getPopulationsWithFestivals,
  getProfessionalAreas,
  getProfessionalFamilies,
  getProvinces,
  getProviders,
  getStudents,
  getTeachers,
  getTrainingActions,
  getTrainingContractStatuses,
  getUsers,
  getWebPlatforms
} from 'src/api/api'
import { provinceActions } from 'src/reducers/general/ProvinceReducer'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { studentActions } from 'src/reducers/students/StudentReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { courseStatusActions } from 'src/reducers/courses/CourseStatusReducer'
import { courseTypeActions } from 'src/reducers/courses/CourseTypeReducer'
import { populationActions } from 'src/reducers/general/PopulationReducer'
import { companyActivityActions } from 'src/reducers/company/CompanyActivityReducer'
import { companyTypeActions } from 'src/reducers/company/CompanyTypeReducer'
import { collaboratorActions } from 'src/reducers/users/CollaboratorReducer'
import { modalityActions } from 'src/reducers/general/ModalityReducer'
import { professionalAreaActions } from 'src/reducers/general/ProfessionalAreaReducer'
import { professionalFamilyActions } from 'src/reducers/general/ProfessionalFamilyReducer'
import { providerActions } from 'src/reducers/company/ProviderReducer'
import { courseOriginActions } from 'src/reducers/courses/CourseOriginReducer'
import { webPlatformActions } from 'src/reducers/trainingActions/WebPlatformReducer'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { trainingContractStatusActions } from 'src/reducers/trainingContracts/TrainingContractStatusReducer'
import { communityActions } from 'src/reducers/trainingContracts/CommunityReducer'
import { userActions } from 'src/reducers/users/UserReducer'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'
import CoursesModal from 'src/views/courses/CoursesModal'
import RegistrationModal from 'src/views/courses/Registrationmodal'
import RegistrationDelete from 'src/views/courses/RegistrationDelete'
import CompaniesModal from 'src/views/companies/CompaniesModal'
import StudentModal from 'src/views/students/StudentsModal'
import TrainingContractsModal from 'src/views/training-contracts/TrainingContractsModal'
import TrainingActionsModal from 'src/views/training-actions/TrainingActionsModal'
import { advisorCommissionActions } from 'src/reducers/advisors/AdvisorCommissionReducer'
import AdvisorCommissionModal from 'src/views/advisors/AdvisorCommissionModal'
import { registrationActions } from 'src/reducers/courses/RegistrationReducer'

const Advisors = () => {
  const hasPermission = useHasPermission(['read.advisors'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  // modal state (adjust slice keys if yours differ)
  const modalOpen = useSelector((state: RootState) => state.advisor.modalOpen)
  const modalMode = useSelector((state: RootState) => state.advisor.modalMode)
  const advisorId = useSelector((state: RootState) => state.advisor.id)
  const courseModalOpen = useSelector((state: RootState) => state.course.modalOpen)
  const courseModalMode = useSelector((state: RootState) => state.course.modalMode)
  const courseId = useSelector((state: RootState) => state.course.id)
  const registrationModalOpen = useSelector((state: RootState) => state.registration.modalOpen)
  const registrationModalMode = useSelector((state: RootState) => state.registration.modalMode)
  const registrationId = useSelector((state: RootState) => state.registration.id)
  const trainingActionModalOpen = useSelector((state: RootState) => state.trainingAction.modalOpen)
  const trainingActionModalMode = useSelector((state: RootState) => state.trainingAction.modalMode)
  const trainingActionId = useSelector((state: RootState) => state.trainingAction.id)
  const trainingContractModalOpen = useSelector((state: RootState) => state.trainingContract.modalOpen)
  const trainingContractModalMode = useSelector((state: RootState) => state.trainingContract.modalMode)
  const trainingContractId = useSelector((state: RootState) => state.trainingContract.id)
  const studentModalOpen = useSelector((state: RootState) => state.student.modalOpen)
  const studentModalMode = useSelector((state: RootState) => state.student.modalMode)
  const studentId = useSelector((state: RootState) => state.student.id)
  const companyModalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const companyModalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)

  // ✅ reset UI when entering the page
  useEffect(() => {
    dispatch(advisorActions.closeAdvisorModal())
    dispatch(advisorActions.setId(null))

    dispatch(courseActions.closeCourseModal())
    dispatch(courseActions.setId(null))
    dispatch(registrationActions.closeRegistrationModal())
    dispatch(registrationActions.setId(null))

    dispatch(trainingActionActions.closeTrainingActionModal())
    dispatch(trainingActionActions.setId(null))

    dispatch(trainingContractActions.closeTrainingContractModal())
    dispatch(trainingContractActions.setId(null))

    dispatch(studentActions.closeStudentModal())
    dispatch(studentActions.setId(null))

    dispatch(companyActions.closeCompanyModal())
    dispatch(companyActions.setId(null))

    dispatch(advisorCommissionActions.closeAdvisorCommissionModal?.() ?? advisorCommissionActions.closeModal())
    dispatch(advisorCommissionActions.setId(null))
  }, [dispatch])

  // ✅ preload advisors list (if your table uses redux list)
  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [
          provincesRes,
          teachersRes,
          centersRes,
          studentsRes,
          companiesRes,
          CoursesRes,
          statusesRes,
          typesRes,
          populationsRes,
          companyActivitiesRes,
          companyTypesRes,
          advisorsRes,
          collaboratorsRes,
          modalitiesRes,
          professionalAreasRes,
          professionalFamiliesRes,
          providersRes,
          courseOriginsRes,
          webPlatformsRes,
          trainingActionsRes,
          trainingContractStatusesRes,
          communitiesRes,
          populationsWithFestivalsRes,
          usersRes
        ] = await Promise.all([
          getProvinces({}),
          getTeachers({ show_inactive: 'false' }),
          getCenters(),
          getStudents({ show_inactive: 'false' }),
          getCompanies({ show_inactive: 'false' }),
          getCourses(),
          getCourseStatuses(),
          getCourseTypes(),
          getPopulations(),
          getCompanyActivities(),
          getCompanyTypes(),
          getAdvisors({ show_inactive: 'false' }),
          getCollaborators({}),
          getModalities(),
          getProfessionalAreas(),
          getProfessionalFamilies(),
          getProviders({ show_inactive: 'false' }),
          getCourseOrigins(),
          getWebPlatforms(),
          getTrainingActions({}),
          getTrainingContractStatuses(),
          getCommunitiesWithFestivals(),
          getPopulationsWithFestivals(),
          getUsers()
        ])

        if (cancelled) return

        dispatch(provinceActions.setProvinces?.(provincesRes.data?.data?.provinces ?? []))
        dispatch(teacherActions.setTeachers?.(teachersRes.data?.data?.teachers ?? []))
        dispatch(centerActions.setCenters?.(centersRes.data?.data?.centers ?? []))
        dispatch(studentActions.setStudents?.(studentsRes.data?.data?.students ?? []))
        dispatch(companyActions.setCompanies?.(companiesRes.data?.data?.companies ?? []))
        dispatch(courseActions.setCourses?.(CoursesRes.data?.data?.courses ?? []))
        dispatch(courseStatusActions.setCourseStatuses?.(statusesRes.data?.data?.course_statuses ?? []))
        dispatch(courseTypeActions.setCourseTypes?.(typesRes.data?.data?.course_types ?? []))
        dispatch(populationActions.setPopulations?.(populationsRes.data?.data?.populations ?? []))
        dispatch(
          companyActivityActions.setCompanyActivities?.(companyActivitiesRes.data?.data?.company_activities ?? [])
        )
        dispatch(companyTypeActions.setCompanyTypes?.(companyTypesRes.data?.data?.company_types ?? []))
        dispatch(advisorActions.setAdvisors?.(advisorsRes.data?.data?.advisors ?? []))
        dispatch(collaboratorActions.setCollaborators?.(collaboratorsRes.data?.data?.collaborators ?? []))
        dispatch(modalityActions.setModalities?.(modalitiesRes.data?.data?.modalities ?? []))
        dispatch(professionalAreaActions.setProfessionalAreas?.(professionalAreasRes.data?.data?.professional_areas ?? []))
        dispatch(
          professionalFamilyActions.setProfessionalFamilies?.(
            professionalFamiliesRes.data?.data?.professional_families ?? []
          )
        )
        dispatch(providerActions.setProviders?.(providersRes.data?.data?.providers ?? []))
        dispatch(courseOriginActions.setCourseOrigins?.(courseOriginsRes.data?.data?.course_origins ?? []))
        dispatch(webPlatformActions.setWebPlatforms?.(webPlatformsRes.data?.data?.web_platforms ?? []))
        dispatch(trainingActionActions.setTrainingActions?.(trainingActionsRes.data?.data?.training_actions ?? []))
        dispatch(
          trainingContractStatusActions.setTrainingContractsStatuses?.(
            trainingContractStatusesRes.data?.data?.training_contract_statuses ?? []
          )
        )
        dispatch(communityActions.setCommunities?.(communitiesRes.data?.data?.communities ?? []))
        dispatch(
          populationActions.setPopulationsWithFestivals?.(populationsWithFestivalsRes.data?.data?.populations ?? [])
        )
        dispatch(userActions.setUsers?.(usersRes.data?.data?.users ?? []))
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
    <Permission requiredPermissions={['read.advisors']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <AdvisorsFilters />
              </CardContent>

              <CardContent>
                <AdvisorsTable />
              </CardContent>

              <AdvisorsModal
                open={modalOpen}
                mode={modalMode}
                advisorId={advisorId}
                onClose={() => dispatch(advisorActions.closeAdvisorModal())}
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
              <TrainingActionsModal
                open={trainingActionModalOpen}
                mode={trainingActionModalMode}
                trainingActionId={trainingActionId}
                onClose={() => dispatch(trainingActionActions.closeTrainingActionModal())}
              />
              <TrainingContractsModal
                open={trainingContractModalOpen}
                mode={trainingContractModalMode}
                trainingContractId={trainingContractId}
                onClose={() => dispatch(trainingContractActions.closeTrainingContractModal())}
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
              <AdvisorCommissionModal />
              <RegistrationDelete />

              <AdvisorsDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Advisors
