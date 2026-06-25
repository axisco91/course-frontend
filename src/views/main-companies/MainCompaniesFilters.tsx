import { Fragment } from 'react'
import { Button, Grid } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import Icon from 'src/@core/components/icon'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { mainCompanyActions } from 'src/reducers/management/MainCompanyReducer'
import { RootState } from 'src/reducers/types/types'
import Filter from '../components/Filter'
import CustomTextField from '../components/CustomTextField'

const hasAny = (permissions: string[], needed: string[]) => needed.some(p => permissions.includes(p))

const MainCompaniesFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const filters = useSelector((state: RootState) => ((state as any).mainCompany?.filters ?? {}) as any)

  const canCreate = Array.isArray(userPermissions)
    ? hasAny(userPermissions, ['create.main_companies', 'create.management'])
    : false

  const setFilter = (key: string, value: any) => dispatch(mainCompanyActions.setFilter({ key, value }))

  const handleCreate = () => {
    dispatch(mainCompanyActions.setId(null))
    dispatch(mainCompanyActions.openModal({ mode: 'create', mainCompanyId: null }))
  }

  const handleReset = () => {
    dispatch(mainCompanyActions.resetFilters())
    dispatch(generalActions.addFilterButtonClickCount())
  }

  const handleApplyFilters = () => {
    dispatch(mainCompanyActions.applyFilters())
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
            label={t('Email')}
            placeholder={t('Email')}
            value={filters.email ?? ''}
            onChange={e => setFilter('email', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Url')}
            placeholder={t('Url')}
            value={filters.url ?? ''}
            onChange={e => setFilter('url', e.target.value)}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default MainCompaniesFilters
