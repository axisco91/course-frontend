import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import ActionTypesFilters from 'src/views/action-types/ActionTypesFilters'
import ActionTypesTable from 'src/views/action-types/ActionTypesTable'
import ActionTypesModal from 'src/views/action-types/ActionTypesModal'
import ActionTypesDelete from 'src/views/action-types/ActionTypesDelete'
import { actionTypeActions } from 'src/reducers/trainingActions/ActionTypeReducer'

const ActionTypes = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.actionType.modalOpen)
  const modalMode = useSelector((state: RootState) => state.actionType.modalMode)
  const id = useSelector((state: RootState) => state.actionType.id)
  console.log(modalMode)

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ActionTypesFilters />
            </CardContent>

            <CardContent>
              <ActionTypesTable />
            </CardContent>

            <ActionTypesModal
              open={modalOpen}
              mode={modalMode}
              actionTypeId={id}
              onClose={() => dispatch(actionTypeActions.closeModal())}
            />

            <ActionTypesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default ActionTypes
