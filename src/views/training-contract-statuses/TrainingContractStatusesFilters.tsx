import { Fragment } from 'react'
import { Button, Grid } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import CustomTextField from '../components/CustomTextField'
import { trainingContractStatusActions } from 'src/reducers/trainingContracts/TrainingContractStatusReducer'

const TrainingContractStatusesFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.management')

  const filters = useSelector((state: RootState) => (state as any).trainingContractStatus.filters)

  const handleCreate = () => {
    dispatch(trainingContractStatusActions.setId(null))
    dispatch(trainingContractStatusActions.openModal({ mode: 'create', trainingContractStatusId: null }))
  }

  const setFilter = (key: string, value: any) => dispatch(trainingContractStatusActions.setFilter({ key, value }))

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

          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='button'
            color='success'
            onClick={() => {
              dispatch(trainingContractStatusActions.applyFilters())
              dispatch(generalActions.addFilterButtonClickCount())
            }}
          >
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
      </Grid>
    </Filter>
  )
}

export default TrainingContractStatusesFilters
