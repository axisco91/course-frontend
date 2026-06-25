import { Fragment, useMemo } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Button, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'
import { potentialCompanyActions } from 'src/reducers/company/PotentialCompanyReducer'
import { generalActions } from 'src/reducers/general/GeneralReducer'

type List = { id: number; name: string; surname?: string }

const PotentialCompaniesFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const filters = useSelector((state: RootState) => (state as any).potentialCompany.filters)
  const companyTypes = useSelector((state: RootState) => (state as any).companyType?.companyTypes ?? []) as List[]
  const activities = useSelector((state: RootState) => (state as any).companyActivity?.companyActivities ?? []) as List[]
  const advisors = useSelector((state: RootState) => (state as any).advisor?.advisors ?? []) as List[]
  const provinces = useSelector((state: RootState) => (state as any).province?.provinces ?? []) as List[]
  const collaborators = useSelector((state: RootState) => (state as any).collaborator?.collaborators ?? []) as List[]

  const statusOptions: List[] = useMemo(
    () => [
      { id: 1, name: 'Active' },
      { id: 2, name: 'Inactive' },
      { id: 3, name: 'Potential' }
    ],
    []
  )

  const setFilter = (key: string, value: any) => dispatch(potentialCompanyActions.setFilter({ key, value }))
  const findById = (list: List[], id: any) => (id == null ? null : list.find(x => Number(x.id) === Number(id)) ?? null)

  const selectedType = useMemo(() => findById(companyTypes, filters.type), [companyTypes, filters.type])
  const selectedActivity = useMemo(() => findById(activities, filters.activity), [activities, filters.activity])
  const selectedAdvisor = useMemo(() => findById(advisors, filters.advisor), [advisors, filters.advisor])
  const selectedProvince = useMemo(() => findById(provinces, filters.province), [provinces, filters.province])
  const selectedCollaborator = useMemo(
    () => findById(collaborators, filters.collaborator),
    [collaborators, filters.collaborator]
  )
  const selectedStatus = useMemo(() => {
    if (!filters.status) return null

    return statusOptions.find(s => String(s.name).toLowerCase() === String(filters.status).toLowerCase()) ?? null
  }, [statusOptions, filters.status])

  return (
    <Filter
      actions={
        <Fragment>
          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='button'
            color='warning'
            onClick={() => dispatch(potentialCompanyActions.changeSendEmailModalStatus())}
          >
            <Icon icon='tabler:mail' fontSize={20} />
            {t('Send email')}
          </Button>

          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='button'
            color='secondary'
            onClick={() => {
              dispatch(potentialCompanyActions.resetFilters())
              dispatch(generalActions.addFilterButtonClickCount())
            }}
          >
            <Icon icon='tabler:refresh' fontSize={20} />
            {t('Reset')}
          </Button>

          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='button'
            color='success'
            onClick={() => {
              dispatch(potentialCompanyActions.applyFilters())
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
            value={filters.name ?? ''}
            onChange={e => setFilter('name', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Cif')}
            value={filters.nif ?? ''}
            onChange={e => setFilter('nif', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Telephone')}
            value={filters.telephone ?? ''}
            onChange={e => setFilter('telephone', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Autocomplete
            options={companyTypes}
            value={selectedType}
            onChange={(_, v) => setFilter('type', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderInput={params => <CustomTextField {...params} label={t('Type')} placeholder={t('Select...')} />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={activities}
            value={selectedActivity}
            onChange={(_, v) => setFilter('activity', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderInput={params => <CustomTextField {...params} label={t('Activity')} placeholder={t('Select...')} />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={provinces}
            value={selectedProvince}
            onChange={(_, v) => setFilter('province', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderInput={params => <CustomTextField {...params} label={t('Province')} placeholder={t('Select...')} />}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Autocomplete
            options={advisors}
            value={selectedAdvisor}
            onChange={(_, v) => setFilter('advisor', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderInput={params => <CustomTextField {...params} label={t('Advisor')} placeholder={t('Select...')} />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={collaborators}
            value={selectedCollaborator}
            onChange={(_, v) => setFilter('collaborator', v ? v.id : null)}
            getOptionLabel={(o: any) => (o ? `${o.name ?? ''} ${o.surname ?? ''}`.trim() : '')}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderInput={params => <CustomTextField {...params} label={t('Collaborator')} placeholder={t('Select...')} />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={statusOptions}
            value={selectedStatus}
            onChange={(_, v) => setFilter('status', v ? v.name : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => String(o.name) === String(v.name)}
            renderInput={params => <CustomTextField {...params} label={t('Status')} placeholder={t('Select...')} />}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default PotentialCompaniesFilters
