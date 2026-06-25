// Chores.tsx
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
import { RootState } from 'src/reducers/types/types'

// ✅ views
import ChoresFilters from 'src/views/chores/ChoresFilters'
import ChoresModal from 'src/views/chores/ChoresModal'
import ChoresDelete from 'src/views/chores/ChoresDelete'

// ✅ reducers
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { studentActions } from 'src/reducers/students/StudentReducer'

// ✅ API
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

// ✅ student modal
import StudentModal from 'src/views/students/StudentsModal'
import ChoresTable from 'src/views/chores/ChoresTable'
import { choreActions } from 'src/reducers/chores/ChoreReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { courseStatusActions } from 'src/reducers/courses/CourseStatusReducer'
import { courseTypeActions } from 'src/reducers/courses/CourseTypeReducer'

const Chores = () => {
  const { t } = useTranslation()
  const hasPermission = useHasPermission(['read.chores'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => state.chore.modalOpen)
  const modalMode = useSelector((state: RootState) => state.chore.modalMode)
  const choreId = useSelector((state: RootState) => state.chore.id)

  const studentModalOpen = useSelector((state: RootState) => state.student.modalOpen)
  const studentModalMode = useSelector((state: RootState) => state.student.modalMode)
  const studentId = useSelector((state: RootState) => state.student.id)

  // ✅ reset UI when entering the page
  useEffect(() => {
    dispatch(choreActions.closeChoreModal?.() ?? { type: 'chore/closeChoreModal' })
    dispatch(choreActions.setId?.(null) ?? { type: 'chore/setId', payload: null })

    dispatch(studentActions.closeStudentModal?.() ?? { type: 'student/closeStudentModal' })
    dispatch(studentActions.setId?.(null) ?? { type: 'student/setId', payload: null })
  }, [dispatch])

  // ✅ load master data: training actions + teachers(active=1) + centers
  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [taRes, teachersRes, centersRes, studentsRes, companiesRes, coursesRes, statusesRes, typesRes] =
          await Promise.all([
            getTrainingActions({}),
            getTeachers({ show_inactive: 'false' }),
            getCenters(),
            getStudents({ show_inactive: 'false' }),
            getCompanies({ show_inactive: 'false' }),
            getCourses(),
            getCourseStatuses(),
            getCourseTypes()
          ])

        if (cancelled) return

        dispatch(trainingActionActions.setTrainingActions?.(taRes.data?.data?.training_actions ?? []))
        dispatch(teacherActions.setTeachers?.(teachersRes.data?.data?.teachers ?? []))
        dispatch(centerActions.setCenters?.(centersRes.data?.data?.centers ?? []))
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

    if (hasPermission) fetchGeneralData()
    else setShow(true)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, dispatch])

  return (
    <Permission requiredPermissions={['read.chores']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <ChoresFilters />
              </CardContent>

              <CardContent>
                <ChoresTable />
              </CardContent>

              <ChoresModal
                open={modalOpen}
                mode={modalMode}
                choreId={choreId}
                onClose={() => dispatch(choreActions.closeChoreModal?.() ?? { type: 'chore/closeChoreModal' })}
              />

              <StudentModal
                open={studentModalOpen}
                mode={studentModalMode}
                studentId={studentId}
                onClose={() => dispatch(studentActions.closeStudentModal?.() ?? { type: 'student/closeStudentModal' })}
              />

              <ChoresDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Chores
