// TrainingContracts.tsx
import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'

// ✅ API (solo si el modal necesita listas maestras; si no, puedes borrar todo este bloque)
import {
  getAdvisors,
  getCenters,
  getCnaes,
  getCollaborators,
  getCommunitiesWithFestivals,
  getCompanies,
  getCompanyActivities,
  getCompanyTypes,
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
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'
import TrainingContractsFilters from 'src/views/training-contracts/TrainingContractsFilters'
import TrainingContractsModal from 'src/views/training-contracts/TrainingContractsModal'
import TrainingContractsTable from 'src/views/training-contracts/TrainingContractsTable'
import TrainingContractsDelete from 'src/views/training-contracts/TrainingContractsDelete'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { studentActions } from 'src/reducers/students/StudentReducer'
import { trainingContractStatusActions } from 'src/reducers/trainingContracts/TrainingContractStatusReducer'
import CompaniesModal from 'src/views/companies/CompaniesModal'
import StudentModal from 'src/views/students/StudentsModal'
import CoursesModal from 'src/views/courses/CoursesModal'
import RegistrationModal from 'src/views/courses/Registrationmodal'
import RegistrationDelete from 'src/views/courses/RegistrationDelete'
import AdvisorsModal from 'src/views/advisors/AdvisorsModal'
import { providerActions } from 'src/reducers/company/ProviderReducer'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { collaboratorActions } from 'src/reducers/users/CollaboratorReducer'
import ExcludedDayDelete from 'src/views/training-contracts/ExtendedDayDelete'
import { communityActions } from 'src/reducers/trainingContracts/CommunityReducer'
import { populationActions } from 'src/reducers/general/PopulationReducer'
import { userActions } from 'src/reducers/users/UserReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { registrationActions } from 'src/reducers/courses/RegistrationReducer'
import { courseStatusActions } from 'src/reducers/courses/CourseStatusReducer'
import { courseTypeActions } from 'src/reducers/courses/CourseTypeReducer'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { companyActivityActions } from 'src/reducers/company/CompanyActivityReducer'
import { companyTypeActions } from 'src/reducers/company/CompanyTypeReducer'
import { cnaeActions } from 'src/reducers/general/CnaeReducer'
import { provinceActions } from 'src/reducers/general/ProvinceReducer'
import { modalityActions } from 'src/reducers/general/ModalityReducer'
import { professionalAreaActions } from 'src/reducers/general/ProfessionalAreaReducer'
import { professionalFamilyActions } from 'src/reducers/general/ProfessionalFamilyReducer'
import { courseOriginActions } from 'src/reducers/courses/CourseOriginReducer'
import { webPlatformActions } from 'src/reducers/trainingActions/WebPlatformReducer'
import TrainingActionsModal from 'src/views/training-actions/TrainingActionsModal'

const TrainingContracts = () => {
  const hasPermission = useHasPermission(['read.training_contracts'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  // ✅ modal state (ajusta claves si tu slice usa otros nombres)
  const modalOpen = useSelector((state: RootState) => state.trainingContract.modalOpen)
  const modalMode = useSelector((state: RootState) => state.trainingContract.modalMode)
  const trainingContractId = useSelector((state: RootState) => state.trainingContract.id)
  const studentModalOpen = useSelector((state: RootState) => state.student.modalOpen)
  const studentModalMode = useSelector((state: RootState) => state.student.modalMode)
  const studentId = useSelector((state: RootState) => state.student.id)
  const companyModalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const companyModalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)
  const courseModalOpen = useSelector((state: RootState) => state.course.modalOpen)
  const courseModalMode = useSelector((state: RootState) => state.course.modalMode)
  const courseId = useSelector((state: RootState) => state.course.id)
  const registrationModalOpen = useSelector((state: RootState) => state.registration.modalOpen)
  const registrationModalMode = useSelector((state: RootState) => state.registration.modalMode)
  const registrationId = useSelector((state: RootState) => state.registration.id)
  const advisorModalOpen = useSelector((state: RootState) => state.advisor.modalOpen)
  const advisorModalMode = useSelector((state: RootState) => state.advisor.modalMode)
  const advisorId = useSelector((state: RootState) => state.advisor.id)
  const trainingActionModalOpen = useSelector((state: RootState) => state.trainingAction.modalOpen)
  const trainingActionModalMode = useSelector((state: RootState) => state.trainingAction.modalMode)
  const trainingActionId = useSelector((state: RootState) => state.trainingAction.id)

  // ✅ reset UI when entering the page
  useEffect(() => {
    dispatch(trainingContractActions.closeTrainingContractModal())
    dispatch(trainingContractActions.setId(null))

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
  }, [dispatch])

  // ✅ preload master data (SOLO si tu TrainingContractsModal lo necesita)
  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [
          teachersRes,
          centersRes,
          provincesRes,
          populationsRes,
          companiesRes,
          studentsRes,
          trainingContractStatusesRes,
          providerRes,
          advisorsRes,
          collaboratorsRes,
          companyActivitiesRes,
          companyTypesRes,
          cnaesRes,
          courseStatusesRes,
          courseTypesRes,
          trainingActionsRes,
          modalitiesRes,
          professionalAreasRes,
          professionalFamiliesRes,
          courseOriginsRes,
          webPlatformsRes,
          communitiesWithFestivalsRes,
          populationsWithFestivalsRes,
          usersRes
        ] = await Promise.all([
          getTeachers({ show_inactive: 'false' }),
          getCenters(),
          getProvinces(),
          getPopulations(),
          getCompanies({ status: 'Active' }),
          getStudents({ show_inactive: 'false' }),
          getTrainingContractStatuses(),
          getProviders({ show_inactive: 'false' }),
          getAdvisors({ show_inactive: 'false' }),
          getCollaborators({ show_inactive: 'false' }),
          getCompanyActivities(),
          getCompanyTypes(),
          getCnaes(),
          getCourseStatuses(),
          getCourseTypes(),
          getTrainingActions({}),
          getModalities(),
          getProfessionalAreas(),
          getProfessionalFamilies(),
          getCourseOrigins(),
          getWebPlatforms(),
          getCommunitiesWithFestivals(),
          getPopulationsWithFestivals(),
          getUsers()
        ])

        if (cancelled) return

        dispatch(teacherActions.setTeachers(teachersRes.data.data.teachers))
        dispatch(centerActions.setCenters(centersRes.data.data.centers))
        dispatch(provinceActions.setProvinces(provincesRes.data.data.provinces))
        dispatch(populationActions.setPopulations(populationsRes.data.data.populations))
        dispatch(companyActions.setCompanies(companiesRes.data.data.companies))
        dispatch(studentActions.setStudents(studentsRes.data.data.students))
        dispatch(
          trainingContractStatusActions.setTrainingContractsStatuses(
            trainingContractStatusesRes.data.data.training_contract_statuses
          )
        )
        dispatch(providerActions.setProviders(providerRes.data.data.providers))
        dispatch(advisorActions.setAdvisors(advisorsRes.data.data.advisors))
        dispatch(collaboratorActions.setCollaborators(collaboratorsRes.data.data.collaborators))
        dispatch(companyActivityActions.setCompanyActivities(companyActivitiesRes.data.data.company_activities))
        dispatch(companyTypeActions.setCompanyTypes(companyTypesRes.data.data.company_types))
        dispatch(cnaeActions.setCnaes(cnaesRes.data.data.cnaes))
        dispatch(courseStatusActions.setCourseStatuses(courseStatusesRes.data.data.course_statuses))
        dispatch(courseTypeActions.setCourseTypes(courseTypesRes.data.data.course_types))
        dispatch(trainingActionActions.setTrainingActions(trainingActionsRes.data.data.training_actions))
        dispatch(modalityActions.setModalities(modalitiesRes.data.data.modalities))
        dispatch(professionalAreaActions.setProfessionalAreas(professionalAreasRes.data.data.professional_areas))
        dispatch(
          professionalFamilyActions.setProfessionalFamilies(professionalFamiliesRes.data.data.professional_families)
        )
        dispatch(courseOriginActions.setCourseOrigins(courseOriginsRes.data.data.course_origins))
        dispatch(webPlatformActions.setWebPlatforms(webPlatformsRes.data.data.web_platforms))
        dispatch(communityActions.setCommunities(communitiesWithFestivalsRes.data.data.communities))
        dispatch(populationActions.setPopulationsWithFestivals(populationsWithFestivalsRes.data.data.populations))
        dispatch(userActions.setUsers(usersRes.data.data.users))
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
    <Permission requiredPermissions={['read.training_contracts']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <TrainingContractsFilters />
              </CardContent>

              <CardContent>
                <TrainingContractsTable />
              </CardContent>

              <TrainingContractsModal
                open={modalOpen}
                mode={modalMode}
                trainingContractId={trainingContractId}
                onClose={() => dispatch(trainingContractActions.closeTrainingContractModal())}
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
              <TrainingActionsModal
                open={trainingActionModalOpen}
                mode={trainingActionModalMode}
                trainingActionId={trainingActionId}
                onClose={() => dispatch(trainingActionActions.closeTrainingActionModal())}
              />

              <TrainingContractsDelete />
              <RegistrationDelete />
              <ExcludedDayDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default TrainingContracts
