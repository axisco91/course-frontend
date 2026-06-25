// Companies.tsx
import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'

// ✅ views (create these like your Courses ones)
import CompaniesFilters from 'src/views/companies/CompaniesFilters'
import CompaniesTable from 'src/views/companies/CompaniesTable'
import CompaniesModal from 'src/views/companies/CompaniesModal'
import CompaniesDelete from 'src/views/companies/CompaniesDelete'

// ✅ reducers (adjust paths/names to your project)
import { companyActions } from 'src/reducers/company/CompanyReducer'

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
  getUsers,
  getWebPlatforms
} from 'src/api/api'
import { provinceActions } from 'src/reducers/general/ProvinceReducer'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { studentActions } from 'src/reducers/students/StudentReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { courseStatusActions } from 'src/reducers/courses/CourseStatusReducer'
import { courseTypeActions } from 'src/reducers/courses/CourseTypeReducer'
import { populationActions } from 'src/reducers/general/PopulationReducer'
import { companyActivityActions } from 'src/reducers/company/CompanyActivityReducer'
import { companyTypeActions } from 'src/reducers/company/CompanyTypeReducer'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { collaboratorActions } from 'src/reducers/users/CollaboratorReducer'
import StudentModal from 'src/views/students/StudentsModal'
import CoursesModal from 'src/views/courses/CoursesModal'
import { userActions } from 'src/reducers/users/UserReducer'
import { cnaeActions } from 'src/reducers/general/CnaeReducer'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { modalityActions } from 'src/reducers/general/ModalityReducer'
import { professionalAreaActions } from 'src/reducers/general/ProfessionalAreaReducer'
import { professionalFamilyActions } from 'src/reducers/general/ProfessionalFamilyReducer'
import { providerActions } from 'src/reducers/company/ProviderReducer'
import { courseOriginActions } from 'src/reducers/courses/CourseOriginReducer'
import { webPlatformActions } from 'src/reducers/trainingActions/WebPlatformReducer'
import ClientDialog from 'src/views/companies/ClientDialog'
import AdvisorDialog from 'src/views/companies/AdvisorDialog'
import ProviderDialog from 'src/views/companies/ProviderDialog'
import AdvisorsModal from 'src/views/advisors/AdvisorsModal'
import TrainingActionsModal from 'src/views/training-actions/TrainingActionsModal'

const Companies = () => {
  const hasPermission = useHasPermission(['read.companies'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  // modal state (adjust slice keys if yours differ)
  const modalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const modalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)
  const studentModalOpen = useSelector((state: RootState) => state.student.modalOpen)
  const studentModalMode = useSelector((state: RootState) => state.student.modalMode)
  const studentId = useSelector((state: RootState) => state.student.id)
  const courseModalOpen = useSelector((state: RootState) => state.course.modalOpen)
  const courseModalMode = useSelector((state: RootState) => state.course.modalMode)
  const courseId = useSelector((state: RootState) => state.course.id)
  const advisorModalOpen = useSelector((state: RootState) => state.advisor.modalOpen)
  const advisorModalMode = useSelector((state: RootState) => state.advisor.modalMode)
  const advisorId = useSelector((state: RootState) => state.advisor.id)
  const trainingActionModalOpen = useSelector((state: RootState) => state.trainingAction.modalOpen)
  const trainingActionModalMode = useSelector((state: RootState) => state.trainingAction.modalMode)
  const trainingActionId = useSelector((state: RootState) => state.trainingAction.id)

  // ✅ reset UI when entering the page (prevents “modal left open”)
  useEffect(() => {
    dispatch(courseActions.closeCourseModal())
    dispatch(courseActions.setId(null))

    dispatch(studentActions.closeStudentModal())
    dispatch(studentActions.setId(null))

    dispatch(companyActions.closeCompanyModal?.() ?? { type: 'company/closeCompanyModal' })
    dispatch(companyActions.setId?.(null) ?? { type: 'company/setId', payload: null })

    dispatch(advisorActions.closeAdvisorModal())
    dispatch(advisorActions.setId(null))

    dispatch(trainingActionActions.closeTrainingActionModal())
    dispatch(trainingActionActions.setId(null))
  }, [dispatch])

  // ✅ preload companies list (if your table uses redux list)
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
          usersRes,
          cnaesRes,
          trainingActionsRes,
          modalitiesRes,
          professionalAreasRes,
          professionalFamiliesRes,
          providersRes,
          courseOriginsRes,
          webPlatformsRes
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
          getUsers(),
          getCnaes(),
          getTrainingActions({}),
          getModalities(),
          getProfessionalAreas(),
          getProfessionalFamilies(),
          getProviders(),
          getCourseOrigins(),
          getWebPlatforms()
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
        dispatch(userActions.setUsers?.(usersRes.data?.data?.users ?? []))
        dispatch(cnaeActions.setCnaes?.(cnaesRes.data?.data?.cnaes ?? []))
        dispatch(trainingActionActions.setTrainingActions?.(trainingActionsRes.data?.data?.training_actions ?? []))
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
    <Permission requiredPermissions={['read.companies']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <CompaniesFilters />
              </CardContent>

              <CardContent>
                <CompaniesTable />
              </CardContent>

              <CompaniesModal
                open={modalOpen}
                mode={modalMode}
                companyId={companyId}
                onClose={() => dispatch(companyActions.closeCompanyModal())}
              />

              <StudentModal
                open={studentModalOpen}
                mode={studentModalMode}
                studentId={studentId}
                onClose={() => dispatch(studentActions.closeStudentModal())}
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

              <CompaniesDelete />
              <ClientDialog />
              <AdvisorDialog />
              <ProviderDialog />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Companies
