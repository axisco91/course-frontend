import { Fragment } from 'react'
import { Button, Grid } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import Icon from 'src/@core/components/icon'
import { RootState } from 'src/reducers/types/types'
import { providerActions } from 'src/reducers/company/ProviderReducer'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import Filter from '../components/Filter'
import CustomTextField from '../components/CustomTextField'

const ProvidersFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const filters = useSelector((state: RootState) => state.provider.filters)

  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.management')

  const setFilter = (key: string, value: any) => dispatch(providerActions.setFilter({ key, value }))

  const handleCreate = () => {
    dispatch(providerActions.setId(null))
    dispatch(providerActions.openModal({ mode: 'create', providerId: null }))
  }

  const handleReset = () => {
    dispatch(providerActions.resetFilters())
    dispatch(generalActions.addFilterButtonClickCount())
  }

  const handleApplyFilters = () => {
    dispatch(providerActions.applyFilters())
    dispatch(generalActions.addFilterButtonClickCount())
  }

  return (
    <Filter
      actions={
        <Fragment>
          {canCreate && (
            <Button variant='contained' sx={{ mr: 4 }} type='button' onClick={handleCreate}>
              <Icon icon='tabler:plus' fontSize={20} />
              {t('New')}
            </Button>
          )}

          <Button variant='contained' sx={{ mr: 4 }} type='button' color='secondary' onClick={handleReset}>
            <Icon icon='tabler:refresh' fontSize={20} />
            {t('Reset')}
          </Button>

          <Button variant='contained' sx={{ mr: 4 }} type='button' color='success' onClick={handleApplyFilters}>
            <Icon icon='tabler:filter' fontSize={20} />
            {t('Filter')}
          </Button>
        </Fragment>
      }
    >
      <Grid container spacing={5}>
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Name')}
            placeholder={t('Name')}
            value={filters.name ?? ''}
            onChange={e => setFilter('name', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Cif')}
            placeholder={t('Cif')}
            value={filters.nif ?? ''}
            onChange={e => setFilter('nif', e.target.value)}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default ProvidersFilters
