// ** React Imports
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Fragment, useContext, useMemo, useState } from 'react'

// ** MUI Imports
import { Button, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Components
import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'
import DownloadElement from 'src/views/components/DownloadElement'

// ** Utils
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { getCompaniesExportExcel } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

type List = { id: number; name: string }

const CompaniesFilters = () => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  const [loading, setLoading] = useState(false)

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.companies')

  // ✅ draft filters
  const filters = useSelector((state: RootState) => (state as any).company.filters)

  // ✅ listas (AJUSTA keys si cambian)
  const companyTypes = useSelector((state: RootState) => (state as any).companyType?.companyTypes ?? []) as List[]
  const activities = useSelector(
    (state: RootState) => (state as any).companyActivity?.companyActivities ?? []
  ) as List[]
  const advisors = useSelector((state: RootState) => (state as any).advisor?.advisors ?? []) as List[]
  const provinces = useSelector((state: RootState) => (state as any).province?.provinces ?? []) as List[]
  const collaborators = useSelector((state: RootState) => (state as any).collaborator?.collaborators ?? []) as List[]
  const populations = useSelector((state: RootState) => (state as any).population?.populations ?? []) as List[]

  const statusOptions: List[] = useMemo(
    () => [
      { id: 1, name: 'Active' },
      { id: 2, name: 'Inactive' },
      { id: 3, name: 'Potential' }
    ],
    []
  )

  // ✅ helpers
  const setFilter = (key: string, value: any) => dispatch(companyActions.setFilter({ key, value }))

  const findById = (list: List[], id: any) =>
    id == null || id === 0 ? null : list.find(x => Number(x.id) === Number(id)) ?? null

  // ✅ selected values para autocompletes
  const selectedType = useMemo(() => findById(companyTypes, filters.type), [companyTypes, filters.type])
  const selectedActivity = useMemo(() => findById(activities, filters.activity), [activities, filters.activity])
  const selectedAdvisor = useMemo(() => findById(advisors, filters.advisor), [advisors, filters.advisor])
  const selectedProvince = useMemo(() => findById(provinces, filters.province), [provinces, filters.province])
  const selectedStatus = useMemo(() => {
    if (!filters.status) return null

    return statusOptions.find(s => String(s.name).toLowerCase() === String(filters.status).toLowerCase()) ?? null
  }, [statusOptions, filters.status])

  const selectedCollaborator = useMemo(
    () => findById(collaborators, filters.collaborator),
    [collaborators, filters.collaborator]
  )
  const selectedPopulation = useMemo(() => findById(populations, filters.population), [populations, filters.population])

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getCompaniesExportExcel(filters)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `empresas_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      handleError(err, logout)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    dispatch(companyActions.setId(null))
    dispatch(companyActions.openModal({ mode: 'create', companyId: null }))
  }

  return (
    <Filter
      actions={
        <Fragment>
          <Button variant='contained' sx={{ mr: 4 }} type='button' color='warning' onClick={obtainExcel}>
            <Icon icon='tabler:download' fontSize={20} />
            {t('Download List')}
          </Button>

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
            color='secondary'
            onClick={() => {
              dispatch(companyActions.resetFilters())
              dispatch(generalActions.addFilterButtonClickCount())
            }}
          >
            <Icon icon='tabler:refresh' fontSize={20} />
            {t('Reset')}
          </Button>

          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='submit'
            color='success'
            onClick={() => {
              dispatch(companyActions.applyFilters())
              dispatch(generalActions.addFilterButtonClickCount())
            }}
          >
            <Icon icon='tabler:filter' fontSize={20} />
            {t('Filter')}
          </Button>
        </Fragment>
      }
    >
      {loading && <DownloadElement text='' />}

      <Grid container spacing={5}>
        {/* Nombre */}
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Name')}
            placeholder={t('Name')}
            value={filters.name ?? ''}
            onChange={e => setFilter('name', e.target.value)}
          />
        </Grid>

        {/* CIF */}
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Cif')}
            placeholder={t('Cif')}
            value={filters.nif ?? ''}
            onChange={e => setFilter('nif', e.target.value)}
          />
        </Grid>

        {/* Tipo */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={companyTypes}
            value={selectedType}
            onChange={(_, v) => setFilter('type', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Type')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Actividad */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={activities}
            value={selectedActivity}
            onChange={(_, v) => setFilter('activity', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Activity')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Asesoría */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={advisors}
            value={selectedAdvisor}
            onChange={(_, v) => setFilter('advisor', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Advisor')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Provincia */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={provinces}
            value={selectedProvince}
            onChange={(_, v) => setFilter('province', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Province')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Estado */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={statusOptions}
            value={selectedStatus}
            onChange={(_, v) => setFilter('status', v ? v.name : null)} // ✅ guardamos string
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => String(o?.name) === String(v?.name)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Status')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Colaborador */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={collaborators}
            value={selectedCollaborator}
            onChange={(_, v) => setFilter('collaborator', v ? v.id : null)}

            // ✅ label = nombre + apellido
            getOptionLabel={(o: any) => (o ? `${o.name ?? ''} ${o.surname ?? ''}`.trim() : '')}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}

            // ✅ lo que se ve en el desplegable
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name} {option.surname}
              </li>
            )}
            renderInput={params => (
              <CustomTextField {...params} label={t('Collaborator')} placeholder={t('Select...')} />
            )}
          />
        </Grid>

        {/* Población */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={populations}
            value={selectedPopulation}
            onChange={(_, v) => setFilter('population', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Population')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Teléfono */}
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Telephone')}
            placeholder={t('Telephone')}
            value={filters.telephone ?? ''}
            onChange={e => setFilter('telephone', e.target.value)}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default CompaniesFilters
