// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import CommunitiesFilters from 'src/views/communties/CommunitiesFilters'
import CommunitiesTable from 'src/views/communties/CommunitiesTable'
import CommunitiesModel from 'src/views/communties/CommunitiesModal'
import CommunitiesDelete from 'src/views/communties/CommunitiesDelete'
import { communityActions } from 'src/reducers/trainingContracts/CommunityReducer'

const Communities = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.community.modalOpen)
  const modalMode = useSelector((state: RootState) => state.community.modalMode)
  const id = useSelector((state: RootState) => state.community.id)

  useEffect(() => {
    dispatch(communityActions.closeModal?.())
    dispatch(communityActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <CommunitiesFilters />
            </CardContent>

            <CardContent>
              <CommunitiesTable />
            </CardContent>

            <CommunitiesModel
              open={modalOpen}
              mode={modalMode}
              communityId={id}
              onClose={() =>
                dispatch(
                  communityActions.closeModal?.() ?? {
                    type: 'communities/closeModal'
                  }
                )
              }
            />

            <CommunitiesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Communities
