import { Fragment, useMemo } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Button, Grid } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'

import { generalActions } from 'src/reducers/general/GeneralReducer'
import CustomTextField from '../components/CustomTextField'
import { populationFestivalActions } from 'src/reducers/trainingContracts/PopulationFestivalReducer'
import { festivalLabel } from 'src/utils/festivalLabel'

type List = { id: number; name: string }

const PopulationFestivalsFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.management')

  const filters = useSelector((state: RootState) => (state as any).populationFestival?.filters ?? {}) as any
  const populations = useSelector((state: RootState) => (state as any).population?.populations ?? []) as List[]
  const nacionalFestivals = useSelector((state: RootState) => (state as any).nacionalFestival?.nacionalFestivals ?? []) as List[]

  const populationsList = useMemo(() => (Array.isArray(populations) ? populations : []), [populations])
  const festivalsList = useMemo(() => (Array.isArray(nacionalFestivals) ? nacionalFestivals : []), [nacionalFestivals])

  const selectedPopulation = useMemo(
    () => populationsList.find(c => Number(c.id) === Number(filters.population_id)) ?? null,
    [populationsList, filters.population_id]
  )

  const selectedFestival = useMemo(
    () => festivalsList.find(f => Number(f.id) === Number(filters.festival_id)) ?? null,
    [festivalsList, filters.festival_id]
  )

  const handleCreate = () => {
    dispatch(populationFestivalActions.setId(null))
    dispatch(populationFestivalActions.setCurrentPopulationFestival(null))
    dispatch(populationFestivalActions.openModal({ mode: 'create', populationFestivalId: null, populationFestival: null }))
  }

  const setFilter = (key: string, value: any) => dispatch(populationFestivalActions.setFilter({ key, value }))

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
              dispatch(populationFestivalActions.applyFilters())
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
          <Autocomplete
            value={selectedPopulation}
            onChange={(_, v) => setFilter('population_id', v?.id ?? null)}
            options={populationsList}
            getOptionLabel={o => o?.name ?? ''}
            isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
            renderInput={params => (
              <CustomTextField {...params} fullWidth label={t('Population')} placeholder={t('Select...')} />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Autocomplete
            value={selectedFestival}
            onChange={(_, v) => setFilter('festival_id', v?.id ?? null)}
            options={festivalsList}
            getOptionLabel={festivalLabel}
            isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
            renderInput={params => (
              <CustomTextField {...params} fullWidth label={t('Festival')} placeholder={t('Select...')} />
            )}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default PopulationFestivalsFilters
