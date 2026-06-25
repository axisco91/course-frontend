// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import { cnaeActions } from 'src/reducers/general/CnaeReducer'
import CnaesFilters from 'src/views/cnaes/CnaesFilters'
import CnaesTable from 'src/views/cnaes/CnaesTable'
import CnaesDelete from 'src/views/cnaes/CnaesDelete'
import CnaesModel from 'src/views/cnaes/CnaesModal'

const Cnaes = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.cnae.modalOpen)
  const modalMode = useSelector((state: RootState) => state.cnae.modalMode)
  const id = useSelector((state: RootState) => state.cnae.id)

  useEffect(() => {
    dispatch(cnaeActions.closeModal?.())
    dispatch(cnaeActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <CnaesFilters />
            </CardContent>

            <CardContent>
              <CnaesTable />
            </CardContent>

            <CnaesModel
              open={modalOpen}
              mode={modalMode}
              cnaeId={id}
              onClose={() =>
                dispatch(
                  cnaeActions.closeModal?.() ?? {
                    type: 'cnaes/closeModal'
                  }
                )
              }
            />

            <CnaesDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Cnaes
