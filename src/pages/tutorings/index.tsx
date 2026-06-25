// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { tutoringActions } from 'src/reducers/trainingActions/TutoringReducer'
import TutoringsFilters from 'src/views/tutorings/TutoringFilters'
import TutoringsTable from 'src/views/tutorings/TutoringTable'
import TutoringsModel from 'src/views/tutorings/TutoringModal'
import TutoringsDelete from 'src/views/tutorings/TutoringDelete'

const ProfessionalCategories = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.tutoring.modalOpen)
  const modalMode = useSelector((state: RootState) => state.tutoring.modalMode)
  const id = useSelector((state: RootState) => state.tutoring.id)

  useEffect(() => {
    dispatch(tutoringActions.closeModal?.())
    dispatch(tutoringActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TutoringsFilters />
            </CardContent>

            <CardContent>
              <TutoringsTable />
            </CardContent>

            <TutoringsModel
              open={modalOpen}
              mode={modalMode}
              tutoringId={id}
              onClose={() =>
                dispatch(
                  tutoringActions.closeModal?.() ?? {
                    type: 'tutoring/closeModal'
                  }
                )
              }
            />

            <TutoringsDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default ProfessionalCategories
