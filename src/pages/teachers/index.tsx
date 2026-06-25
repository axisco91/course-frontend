// Teachers.tsx
import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import {
  getCenters,
  getCompanies,
  getCourseOrigins,
  getCourseStatuses,
  getCourseTypes,
  getModalities,
  getProfessionalAreas,
  getProfessionalFamilies,
  getProvinces,
  getProviders,
  getStudents,
  getTeacherAreas,
  getTeachers,
  getTrainingActions,
  getWebPlatforms
} from 'src/api/api'
import { RootState } from 'src/reducers/types/types'
import TeachersFilters from 'src/views/teachers/TeachersFilters'
import TeachersDelete from 'src/views/teachers/TeachersDelete'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import TeachersTable from 'src/views/teachers/TeachersTable'
import { teacherAreaActions } from 'src/reducers/teachers/TeacherAreaReducer'
import TeachersModal from 'src/views/teachers/TeachersModal'
import CoursesModal from 'src/views/courses/CoursesModal'
import CompaniesModal from 'src/views/companies/CompaniesModal'
import TrainingActionsModal from 'src/views/training-actions/TrainingActionsModal'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { courseOriginActions } from 'src/reducers/courses/CourseOriginReducer'
import { courseStatusActions } from 'src/reducers/courses/CourseStatusReducer'
import { courseTypeActions } from 'src/reducers/courses/CourseTypeReducer'
import { modalityActions } from 'src/reducers/general/ModalityReducer'
import { professionalAreaActions } from 'src/reducers/general/ProfessionalAreaReducer'
import { professionalFamilyActions } from 'src/reducers/general/ProfessionalFamilyReducer'
import { provinceActions } from 'src/reducers/general/ProvinceReducer'
import { studentActions } from 'src/reducers/students/StudentReducer'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { webPlatformActions } from 'src/reducers/trainingActions/WebPlatformReducer'
import { providerActions } from 'src/reducers/company/ProviderReducer'

const Teachers = () => {
  const hasPermission = useHasPermission(['read.teachers'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => state.teacher.modalOpen)
  const modalMode = useSelector((state: RootState) => state.teacher.modalMode)
  const teacherId = useSelector((state: RootState) => state.teacher.id)
  const courseModalOpen = useSelector((state: RootState) => state.course.modalOpen)
  const courseModalMode = useSelector((state: RootState) => state.course.modalMode)
  const courseId = useSelector((state: RootState) => state.course.id)
  const trainingActionModalOpen = useSelector((state: RootState) => state.trainingAction.modalOpen)
  const trainingActionModalMode = useSelector((state: RootState) => state.trainingAction.modalMode)
  const trainingActionId = useSelector((state: RootState) => state.trainingAction.id)
  const companyModalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const companyModalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)

  // ✅ reset SOLO al entrar en la página (sin cleanup)
  useEffect(() => {
    dispatch(teacherActions.closeTeacherModal())
    dispatch(teacherActions.setId(null))

    dispatch(courseActions.closeCourseModal())
    dispatch(courseActions.setId(null))

    dispatch(trainingActionActions.closeTrainingActionModal())
    dispatch(trainingActionActions.setId(null))

    // unmount
    dispatch(companyActions.closeCompanyModal())
    dispatch(companyActions.setId(null))
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [
          teacherAreaRes,
          taRes,
          teachersRes,
          centersRes,
          courseTypesRes,
          courseStatusesRes,
          companiesRes,
          studentsRes,
          modalitiesRes,
          professionalAreasRes,
          professionalFamiliesRes,
          provincesRes,
          providersRes,
          courseOriginsRes,
          webPlatformsRes
        ] = await Promise.all([
          getTeacherAreas({}),
          getTrainingActions({}),
          getTeachers({ show_inactive: 'false' }),
          getCenters(),
          getCourseTypes(),
          getCourseStatuses(),
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

        dispatch(teacherAreaActions.setTeacherAreas(teacherAreaRes.data.data.teacher_areas))
        dispatch(trainingActionActions.setTrainingActions(taRes.data.data.training_actions))
        dispatch(teacherActions.setTeachers(teachersRes.data.data.teachers))
        dispatch(centerActions.setCenters(centersRes.data.data.centers))
        dispatch(courseTypeActions.setCourseTypes(courseTypesRes.data.data.course_types))
        dispatch(courseStatusActions.setCourseStatuses(courseStatusesRes.data.data.course_statuses))
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
    <Permission requiredPermissions={['read.teachers']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <TeachersFilters />
              </CardContent>

              <CardContent>
                <TeachersTable />
              </CardContent>

              <TeachersModal
                open={modalOpen}
                mode={modalMode}
                teacherId={teacherId}
                onClose={() => dispatch(teacherActions.closeTeacherModal())}
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

              <CompaniesModal
                open={companyModalOpen}
                mode={companyModalMode}
                companyId={companyId}
                onClose={() => dispatch(companyActions.closeCompanyModal())}
              />

              <TeachersDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Teachers
