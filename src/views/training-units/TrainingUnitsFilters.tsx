import { Fragment } from 'react'
import { Button, Grid } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { trainingUnitActions } from 'src/reducers/general/TrainingUnitReducer'
import { RootState } from 'src/reducers/types/types'
import CustomTextField from 'src/views/components/CustomTextField'
import Filter from 'src/views/components/Filter'

const TrainingUnitsFilters = () => {
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const filters = useSelector((state: RootState) => state.trainingUnit.filters)

  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.management')

  const setFilter = (key: string, value: string) => dispatch(trainingUnitActions.setFilter({ key, value }))

  const handleCreate = () => {
    dispatch(trainingUnitActions.setId(null))
    dispatch(trainingUnitActions.setName(''))
    dispatch(trainingUnitActions.openModal({ mode: 'create', trainingUnitId: null }))
  }

  const handleFilter = () => {
    dispatch(trainingUnitActions.applyFilters())
    dispatch(generalActions.addFilterButtonClickCount())
  }

  const handleReset = () => {
    dispatch(trainingUnitActions.resetFilters())
    dispatch(generalActions.addFilterButtonClickCount())
  }

  return (
    <Filter
      actions={
        <Fragment>
          {canCreate && (
            <Button variant='contained' sx={{ mr: 4 }} type='button' onClick={handleCreate}>
              <Icon icon='tabler:plus' fontSize={20} />
              Nueva
            </Button>
          )}

          <Button variant='contained' sx={{ mr: 4 }} type='button' color='secondary' onClick={handleReset}>
            <Icon icon='tabler:refresh' fontSize={20} />
            Limpiar
          </Button>

          <Button variant='contained' sx={{ mr: 4 }} type='button' color='success' onClick={handleFilter}>
            <Icon icon='tabler:filter' fontSize={20} />
            Filtrar
          </Button>
        </Fragment>
      }
    >
      <Grid container spacing={5}>
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label='Código'
            placeholder='Código'
            value={filters.code ?? ''}
            onChange={e => setFilter('code', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label='Nombre'
            placeholder='Nombre'
            value={filters.name ?? ''}
            onChange={e => setFilter('name', e.target.value)}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default TrainingUnitsFilters
