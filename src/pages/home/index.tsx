// src/pages/index.tsx (o donde tengas Home)
import { Fragment, useContext, useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import CoursesMetric from '../../views/dashboard/CoursesMetric'
import CoursesTeacherMetric from 'src/views/dashboard/CourseTeachermetric'
import ProfitsMetric from 'src/views/dashboard/ProfitsMetric'
import Calendar from 'src/views/dashboard/Calendar'
import LiveMetric from 'src/views/dashboard/LiveMetric'
import CommissionsMetric from 'src/views/dashboard/Commissionsmetric'
import useHasPermission from 'src/context/hasPermission'
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
import { useDispatch } from 'react-redux'
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { centerActions } from 'src/reducers/centers/CenterReducer'
import { studentActions } from 'src/reducers/students/StudentReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { courseStatusActions } from 'src/reducers/courses/CourseStatusReducer'
import { courseTypeActions } from 'src/reducers/courses/CourseTypeReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

// luego metes SalesMetric, CalendarMetric, etc

const Home = () => {
  const userData = useSelector((state: RootState) => (state as any).auth?.userData)
  const hasProfitPermission = useHasPermission(['read.profits'])
  const hasPermission = useHasPermission(['read.tracings'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const [show, setShow] = useState(false)

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

    if (hasPermission) fetchGeneralData()
    else setShow(true)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, dispatch])

  return (
    <Fragment>
      <Grid container spacing={6}>
        <Grid item xs={12} md={6}>
          <CoursesMetric />
        </Grid>
        <Grid item xs={12} md={6}>
          {userData?.role === 'Docente' ? <CoursesTeacherMetric /> : hasProfitPermission ? <ProfitsMetric /> : ''}
        </Grid>
        {show && (
          <Grid item xs={12} md={12}>
            {<Calendar />}
          </Grid>
        )}
        {userData?.role !== 'Docente' ? (
          <Grid container spacing={6}>
            <Grid item xs={12} lg={6}>
              <LiveMetric />
            </Grid>

            {hasProfitPermission ? (
              <Grid item xs={12} lg={6}>
                <CommissionsMetric />
              </Grid>
            ) : (
              ''
            )}
          </Grid>
        ) : null}
      </Grid>
    </Fragment>
  )
}

export default Home
