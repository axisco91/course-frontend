// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { onLeaveActions } from 'src/reducers/trainingContracts/OnLeaveReducer'
import OnLeaveTypesFilters from 'src/views/on-leave-types/OnLeaveTypesFilters'
import OnLeaveTypesTable from 'src/views/on-leave-types/OnLeaveTypesTable'
import OnLeaveTypesModel from 'src/views/on-leave-types/OnLeaveTypesModal'
import OnLeaveTypesDelete from 'src/views/on-leave-types/OnLeaveTypesDelete'

const OnLeaveTypes = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.onLeave.modalOpen)
  const modalMode = useSelector((state: RootState) => state.onLeave.modalMode)
  const id = useSelector((state: RootState) => state.onLeave.id)

  useEffect(() => {
    dispatch(onLeaveActions.closeOnLeaveModal?.())
    dispatch(onLeaveActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <OnLeaveTypesFilters />
            </CardContent>

            <CardContent>
              <OnLeaveTypesTable />
            </CardContent>

            <OnLeaveTypesModel
              open={modalOpen}
              mode={modalMode}
              onLeaveTypeId={id}
              onClose={() =>
                dispatch(
                  onLeaveActions.closeOnLeaveModal?.() ?? {
                    type: 'onLeave-types/closeModal'
                  }
                )
              }
            />

            <OnLeaveTypesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default OnLeaveTypes
