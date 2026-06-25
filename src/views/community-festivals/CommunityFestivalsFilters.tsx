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
import { communityFestivalActions } from 'src/reducers/trainingContracts/CommunityFestivalReducer'
import { festivalLabel } from 'src/utils/festivalLabel'

type List = { id: number; name: string }

const CommunityFestivalsFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.management')

  const filters = useSelector((state: RootState) => (state as any).communityFestival?.filters ?? {}) as any
  const communities = useSelector((state: RootState) => (state as any).community?.communities ?? []) as List[]
  const nacionalFestivals = useSelector((state: RootState) => (state as any).nacionalFestival?.nacionalFestivals ?? []) as List[]

  const communitiesList = useMemo(() => (Array.isArray(communities) ? communities : []), [communities])
  const festivalsList = useMemo(() => (Array.isArray(nacionalFestivals) ? nacionalFestivals : []), [nacionalFestivals])

  const selectedCommunity = useMemo(
    () => communitiesList.find(c => Number(c.id) === Number(filters.community_id)) ?? null,
    [communitiesList, filters.community_id]
  )

  const selectedFestival = useMemo(
    () => festivalsList.find(f => Number(f.id) === Number(filters.festival_id)) ?? null,
    [festivalsList, filters.festival_id]
  )

  const handleCreate = () => {
    dispatch(communityFestivalActions.setId(null))
    dispatch(communityFestivalActions.setCurrentCommunityFestival(null))
    dispatch(communityFestivalActions.openModal({ mode: 'create', communityFestivalId: null, communityFestival: null }))
  }

  const setFilter = (key: string, value: any) => dispatch(communityFestivalActions.setFilter({ key, value }))

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
              dispatch(communityFestivalActions.applyFilters())
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
            value={selectedCommunity}
            onChange={(_, v) => setFilter('community_id', v?.id ?? null)}
            options={communitiesList}
            getOptionLabel={o => o?.name ?? ''}
            isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
            renderInput={params => (
              <CustomTextField {...params} fullWidth label={t('Community')} placeholder={t('Select...')} />
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

export default CommunityFestivalsFilters
