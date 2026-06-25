// ProfitsFilters.tsx
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Fragment, useContext, useMemo, useState } from 'react'
import { Button, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'
import DownloadElement from 'src/views/components/DownloadElement'

import { generalActions } from 'src/reducers/general/GeneralReducer'
import { profitActions } from 'src/reducers/profits/ProfitReducer'
import { getProfitsExportExcel } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

type Option = { id: number; name: string; label?: string }

const ProfitsFilters = () => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const filters = useSelector((state: RootState) => (state as any).profit.filters)

  // listas (ajusta dónde las guardas)
  const courses = useSelector((state: RootState) => (state as any).course.courses ?? []) as Option[]
  const companies = useSelector((state: RootState) => (state as any).company.companies ?? []) as Option[]
  const statuses = useSelector((state: RootState) => (state as any).courseStatus?.courseStatuses ?? []) as Option[]

  const setFilter = (key: string, value: any) => dispatch(profitActions.setFilter({ key, value }))

  const findById = (list: Option[], id: any) => {
    if (id == null) return null

    return list.find(x => Number(x.id) === Number(id)) ?? null
  }

  const selectedCourse = useMemo(() => findById(courses, filters.course), [courses, filters.course])
  const selectedCompany = useMemo(() => findById(companies, filters.company), [companies, filters.company])
  const selectedStatus = useMemo(() => {
    const v = filters.status
    const id = v == null ? -1 : Number(v)

    return statuses.find(x => x.id === id) ?? statuses[0]
  }, [filters.status, statuses])

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getProfitsExportExcel(filters)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alumnos_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
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
              dispatch(profitActions.resetFilters())
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
              dispatch(profitActions.applyFilters())
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
        {/* Curso */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={courses}
            value={selectedCourse}
            onChange={(_, v) => setFilter('course', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.label ?? o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.label ?? option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Course')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Empresa */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={companies}
            value={selectedCompany}
            onChange={(_, v) => setFilter('company', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Company')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Estado */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={statuses}
            value={selectedStatus}
            onChange={(_, v) => setFilter('status', !v || v.id === -1 ? null : v.id)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Status')} placeholder={t('Select...')} />}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default ProfitsFilters
