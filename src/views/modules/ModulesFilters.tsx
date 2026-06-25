import { Fragment } from 'react'
import { Button, Grid } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { moduleActions } from 'src/reducers/general/ModuleReducer'
import { RootState } from 'src/reducers/types/types'
import CustomTextField from 'src/views/components/CustomTextField'
import Filter from 'src/views/components/Filter'

const ModulesFilters = () => {
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const filters = useSelector((state: RootState) => state.module.filters)

  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.management')

  const setFilter = (key: string, value: string) => dispatch(moduleActions.setFilter({ key, value }))

  const handleCreate = () => {
    dispatch(moduleActions.setId(null))
    dispatch(moduleActions.setName(''))
    dispatch(moduleActions.openModal({ mode: 'create', moduleId: null }))
  }

  const handleFilter = () => {
    dispatch(moduleActions.applyFilters())
    dispatch(generalActions.addFilterButtonClickCount())
  }

  const handleReset = () => {
    dispatch(moduleActions.resetFilters())
    dispatch(generalActions.addFilterButtonClickCount())
  }

  return (
    <Filter
      actions={
        <Fragment>
          {canCreate && (
            <Button variant='contained' sx={{ mr: 4 }} type='button' onClick={handleCreate}>
              <Icon icon='tabler:plus' fontSize={20} />
              Nuevo
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

export default ModulesFilters
