// ** React Imports
import { Fragment } from 'react'

// ** MUI Imports
import { Button, Grid } from '@mui/material'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Components
import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'

// ** Utils
import { generalActions } from 'src/reducers/general/GeneralReducer'
import CustomTextField from '../components/CustomTextField'
import { trainingContractSerieActions } from 'src/reducers/trainingContracts/TrainingContractSerieReducer'

const SeriesFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]

  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.management')

  const filters = useSelector((state: RootState) => (state as any).trainingContractSerie.filters)

  const handleCreate = () => {
    dispatch(trainingContractSerieActions.setId(null))

    // ✅ abre modal en create
    dispatch(trainingContractSerieActions.openModal({ mode: 'create', trainingContractSerieId: null }))
  }

  const setFilter = (key: string, value: any) => dispatch(trainingContractSerieActions.setFilter({ key, value }))

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
            type='submit'
            color='success'
            onClick={() => {
              dispatch(trainingContractSerieActions.applyFilters())
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
            label={t('Series')}
            placeholder={t('Series')}
            value={filters.series ?? ''}
            onChange={e => setFilter('series', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Description')}
            placeholder={t('Description')}
            value={filters.description ?? ''}
            onChange={e => setFilter('description', e.target.value)}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default SeriesFilters
