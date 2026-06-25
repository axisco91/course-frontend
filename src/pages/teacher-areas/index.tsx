// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { teacherAreaActions } from 'src/reducers/teachers/TeacherAreaReducer'
import TeacherAreasFilters from 'src/views/teacher-areas/TeacherAreasFilters'
import TeacherAreasTable from 'src/views/teacher-areas/TeacherAreasTable'
import TeacherAreasModel from 'src/views/teacher-areas/TeacherAreasModal'
import TeacherAreasDelete from 'src/views/teacher-areas/TeacherAreasDelete'

const TeacherAreas = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.teacherArea.modalOpen)
  const modalMode = useSelector((state: RootState) => state.teacherArea.modalMode)
  const id = useSelector((state: RootState) => state.teacherArea.id)

  useEffect(() => {
    dispatch(teacherAreaActions.closeModal?.())
    dispatch(teacherAreaActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TeacherAreasFilters />
            </CardContent>

            <CardContent>
              <TeacherAreasTable />
            </CardContent>

            <TeacherAreasModel
              open={modalOpen}
              mode={modalMode}
              teacherAreaId={id}
              onClose={() =>
                dispatch(
                  teacherAreaActions.closeModal?.() ?? {
                    type: 'teacher-areas/closeModal'
                  }
                )
              }
            />

            <TeacherAreasDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default TeacherAreas
