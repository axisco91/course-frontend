// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
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
  getCourses,
  getCourseStatuses,
  getCourseTypes,
  getStudents,
  getTeachers,
  getTrainingActions
} from 'src/api/api'
import StudentsFilters from 'src/views/students/StudentsFilters'
import StudentsTable from 'src/views/students/StudentsTable'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { RootState } from 'src/reducers/types/types'
import { studentActions } from 'src/reducers/students/StudentReducer'
import StudentsDelete from 'src/views/students/StudentsDelete'
import StudentModal from 'src/views/students/StudentsModal'
import CoursesModal from 'src/views/courses/CoursesModal'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import CompaniesModal from 'src/views/companies/CompaniesModal'
import { courseStatusActions } from 'src/reducers/courses/CourseStatusReducer'
import { courseTypeActions } from 'src/reducers/courses/CourseTypeReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'

const Students = () => {
  const { t } = useTranslation()
  const hasPermission = useHasPermission(['read.students'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => state.student.modalOpen)
  const modalMode = useSelector((state: RootState) => state.student.modalMode)
  const studentId = useSelector((state: RootState) => state.student.id)
  const courseModalOpen = useSelector((state: RootState) => state.course.modalOpen)
  const courseModalMode = useSelector((state: RootState) => state.course.modalMode)
  const courseId = useSelector((state: RootState) => state.course.id)
  const companyModalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const companyModalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)

  useEffect(() => {
    dispatch(courseActions.closeCourseModal())
    dispatch(courseActions.setId(null))

    dispatch(studentActions.closeStudentModal())
    dispatch(studentActions.setId(null))

    // unmount
    dispatch(companyActions.closeCompanyModal())
    dispatch(companyActions.setId(null))
  }, [dispatch])

  // ✅ IMPORTANTE: useEffect con dependencias (evita recarga infinita)
  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [taRes, teachersRes, centersRes, coursesRes, companiesRes, studentsRes, statusesRes, typesRes] =
          await Promise.all([
            getTrainingActions({}),
            getTeachers({ show_inactive: 'false' }),
            getCenters(),
            getCourses(),
            getCompanies({ show_inactive: 'false' }),
            getStudents({ show_inactive: 'false' }),
            getCourseStatuses(),
            getCourseTypes()
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
      } catch (error) {
        if (!cancelled) handleError(error, logout)
      } finally {
        if (!cancelled) setShow(true)
      }
    }

    if (hasPermission) {
      fetchGeneralData()
    } else {
      // si no tiene permiso, no hagas llamadas y corta loading
      setShow(true)
    }

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, dispatch])

  return (
    <Permission requiredPermissions={['read.students']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <StudentsFilters />
              </CardContent>

              <CardContent>
                <StudentsTable />
              </CardContent>

              <StudentModal
                open={modalOpen}
                mode={modalMode}
                studentId={studentId}
                onClose={() => dispatch(studentActions.closeStudentModal())}
              />
              <CoursesModal
                open={courseModalOpen}
                mode={courseModalMode}
                courseId={courseId}
                onClose={() => dispatch(courseActions.closeCourseModal())}
              />

              <CompaniesModal
                open={companyModalOpen}
                mode={companyModalMode}
                companyId={companyId}
                onClose={() => dispatch(companyActions.closeCompanyModal())}
              />
              <StudentsDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Students
