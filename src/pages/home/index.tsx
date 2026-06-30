import { Fragment } from 'react'
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

const Home = () => {
  const userData = useSelector((state: RootState) => (state as any).auth?.userData)
  const hasProfitPermission = useHasPermission(['read.profits'])
  const hasPermission = useHasPermission(['read.tracings'])

  return (
    <Fragment>
      <Grid container spacing={6}>
        <Grid item xs={12} md={6}>
          <CoursesMetric />
        </Grid>
        <Grid item xs={12} md={6}>
          {userData?.role === 'Docente' ? <CoursesTeacherMetric /> : hasProfitPermission ? <ProfitsMetric /> : ''}
        </Grid>
        {hasPermission && (
          <Grid item xs={12} md={12}>
            <Calendar />
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
