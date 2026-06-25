import { Card, CardContent } from '@mui/material'
import Grid from '@mui/material/Grid'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { moduleActions } from 'src/reducers/general/ModuleReducer'
import { RootState } from 'src/reducers/types/types'
import ModulesDelete from 'src/views/modules/ModulesDelete'
import ModulesFilters from 'src/views/modules/ModulesFilters'
import ModulesModal from 'src/views/modules/ModulesModal'
import ModulesTable from 'src/views/modules/ModulesTable'

const Modules = () => {
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.module.modalOpen)
  const modalMode = useSelector((state: RootState) => state.module.modalMode)
  const id = useSelector((state: RootState) => state.module.id)

  useEffect(() => {
    dispatch(moduleActions.closeModal?.())
    dispatch(moduleActions.setId?.(null))
    dispatch(moduleActions.setName?.(''))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ModulesFilters />
            </CardContent>

            <CardContent>
              <ModulesTable />
            </CardContent>

            <ModulesModal
              open={modalOpen}
              mode={modalMode}
              moduleId={id}
              onClose={() =>
                dispatch(
                  moduleActions.closeModal?.() ?? {
                    type: 'module/closeModal'
                  }
                )
              }
            />

            <ModulesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Modules
