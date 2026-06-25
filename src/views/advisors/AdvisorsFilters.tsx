// ** React Imports
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Fragment, useContext, useMemo, useState } from 'react'

// ** MUI Imports
import { Button, Checkbox, FormControlLabel, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'

// ** ThirdParty
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
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { getAdvisorsExportExcel } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

type List = { id: number; name: string }

const AdvisorsFilters = () => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  const [loading, setLoading] = useState(false)

  // ✅ draft filters
  const filters = useSelector((state: RootState) => (state as any).advisor.filters)

  // ✅ listas
  const companyTypes = useSelector((state: RootState) => (state as any).companyType?.companyTypes ?? []) as List[]
  const activities = useSelector(
    (state: RootState) => (state as any).companyActivity?.companyActivities ?? []
  ) as List[]
  const provinces = useSelector((state: RootState) => (state as any).province?.provinces ?? []) as List[]

  const setFilter = (key: string, value: any) => dispatch(advisorActions.setFilter({ key, value }))

  const findById = (list: List[], id: any) => (id == null ? null : list.find(x => Number(x.id) === Number(id)) ?? null)

  const selectedType = useMemo(() => findById(companyTypes, filters.type), [companyTypes, filters.type])
  const selectedActivity = useMemo(() => findById(activities, filters.activity), [activities, filters.activity])
  const selectedProvince = useMemo(() => findById(provinces, filters.province), [provinces, filters.province])

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getAdvisorsExportExcel(filters)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `asesorias_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
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

  return (
    <Filter
      actions={
        <Fragment>
          <Button variant='contained' sx={{ mr: 4 }} type='button' color='warning' onClick={obtainExcel}>
            <Icon icon='tabler:download' fontSize={20} />
            {t('Download List')}
          </Button>

          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='button'
            color='secondary'
            onClick={() => {
              dispatch(advisorActions.resetFilters())
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
              dispatch(advisorActions.applyFilters())
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
            onChange={e => setFilter('name', e.target.value || null)}
          />
        </Grid>

        {/* CIF */}
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Cif')}
            placeholder={t('Cif')}
            value={filters.nif ?? ''}
            onChange={e => setFilter('nif', e.target.value || null)}
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

        {/* Mostrar Inactivo */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!filters.show_inactive}
                onChange={e => setFilter('show_inactive', e.target.checked)}
              />
            }
            label={t('Show inactive')}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default AdvisorsFilters
