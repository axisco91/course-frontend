// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import ProfessionalCategoriesDelete from 'src/views/professional-categories/ProfessionalCateogoriesDelete'
import { webPlatformActions } from 'src/reducers/trainingActions/WebPlatformReducer'
import WebPlatformsFilters from 'src/views/web-platfomrs/WebPlatformsFilters'
import WebPlatformsTable from 'src/views/web-platfomrs/WebPlatformsTable'
import WebPlatformsModel from 'src/views/web-platfomrs/WebPlatformsModal'
import WebPlatformsDelete from 'src/views/web-platfomrs/WebPlatformsDelete'

const WebPlatforms = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.webPlatform.modalOpen)
  const modalMode = useSelector((state: RootState) => state.webPlatform.modalMode)
  const id = useSelector((state: RootState) => state.webPlatform.id)

  useEffect(() => {
    dispatch(webPlatformActions.closeModal?.())
    dispatch(webPlatformActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <WebPlatformsFilters />
            </CardContent>

            <CardContent>
              <WebPlatformsTable />
            </CardContent>

            <WebPlatformsModel
              open={modalOpen}
              mode={modalMode}
              webPlatformId={id}
              onClose={() =>
                dispatch(
                  webPlatformActions.closeModal?.() ?? {
                    type: 'web-platforms/closeModal'
                  }
                )
              }
            />

            <WebPlatformsDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default WebPlatforms
