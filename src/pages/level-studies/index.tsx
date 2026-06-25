// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import LevelStudiesTable from 'src/views/level-studies/LevelStudiesTable'
import LevelStudiesFilters from 'src/views/level-studies/LevelStudiesFilters'
import { levelStudyActions } from 'src/reducers/general/LevelStudyReducer'
import LevelStudiesModel from 'src/views/level-studies/LevelStudiesModal'
import LevelStudiesDelete from 'src/views/level-studies/LevelStudiesDelete'

const Tracings = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.levelStudy.modalOpen)
  const modalMode = useSelector((state: RootState) => state.levelStudy.modalMode)
  const id = useSelector((state: RootState) => state.levelStudy.id)

  useEffect(() => {
    dispatch(levelStudyActions.closeModal?.())
    dispatch(levelStudyActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <LevelStudiesFilters />
            </CardContent>

            <CardContent>
              <LevelStudiesTable />
            </CardContent>

            <LevelStudiesModel
              open={modalOpen}
              mode={modalMode}
              levelStudyId={id}
              onClose={() =>
                dispatch(
                  levelStudyActions.closeModal?.() ?? {
                    type: 'level-studies/closeModal'
                  }
                )
              }
            />

            <LevelStudiesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Tracings
