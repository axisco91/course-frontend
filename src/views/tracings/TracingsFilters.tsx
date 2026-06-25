import { Fragment, useContext, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'

// MUI
import { Button, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'

// i18n
import { useTranslation } from 'react-i18next'

// redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// components
import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'
import DownloadElement from 'src/views/components/DownloadElement'

// actions
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { tracingActions } from 'src/reducers/tracings/TracingReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { getTracingsExportExcel } from 'src/api/api'

type Option = { id: number; name: string }
type CourseOption = { id: number; label?: string; name?: string }
type StudentOption = { id: number; name: string; surname?: string }
type CompanyOption = { id: number; name: string }

const TracingsFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)

  // ✅ draft filters
  const filters = useSelector((state: RootState) => (state as any).tracing.filters)

  // ✅ listas desde reducers (AJUSTA RUTAS)
  const courses = useSelector((state: RootState) => (state as any).course.courses ?? []) as CourseOption[]
  const companies = useSelector((state: RootState) => (state as any).company.companies ?? []) as CompanyOption[]
  const students = useSelector((state: RootState) => (state as any).student.students ?? []) as StudentOption[]
  const courseStatuses = useSelector((state: RootState) => (state as any).courseStatus.courseStatuses ?? []) as Option[]
  const courseTypes = useSelector((state: RootState) => (state as any).courseType.courseTypes ?? []) as Option[]

  // ✅ setter
  const setFilter = (key: string, value: any) => dispatch(tracingActions.setFilter({ key, value }))

  // ✅ helpers selected value by id
  const findById = <T extends { id: number }>(list: T[], id: any): T | null =>
    id == null ? null : list.find(x => Number(x.id) === Number(id)) ?? null

  // ✅ selected values
  const courseValue = useMemo(() => findById(courses, filters.course), [courses, filters.course])
  const companyValue = useMemo(() => findById(companies, filters.company), [companies, filters.company])
  const studentValue = useMemo(() => findById(students, filters.student), [students, filters.student])
  const statusValue = useMemo(() => findById(courseStatuses, filters.status), [courseStatuses, filters.status])
  const typeValue = useMemo(() => findById(courseTypes, filters.type), [courseTypes, filters.type])

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getTracingsExportExcel(filters)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `seguimientos_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
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
              dispatch(tracingActions.resetFilters())
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
              dispatch(tracingActions.applyFilters())
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
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={courses}
            value={courseValue}
            onChange={(_, v) => setFilter('course', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.label ?? o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderInput={params => <CustomTextField {...params} label={t('Course')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Empresa */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={companies}
            value={companyValue}
            onChange={(_, v) => setFilter('company', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderInput={params => <CustomTextField {...params} label={t('Company')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Alumno */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={students}
            value={studentValue}
            onChange={(_, v) => setFilter('student', v ? v.id : null)}
            getOptionLabel={(o: any) => `${o?.name ?? ''} ${o?.surname ?? ''}`.trim()}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderInput={params => <CustomTextField {...params} label={t('Student')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Estado */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={courseStatuses}
            value={statusValue}
            onChange={(_, v) => setFilter('status', v ? v.id : null)} // si tu back espera name, cambia a v.name
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderInput={params => <CustomTextField {...params} label={t('Status')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Tipo */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={courseTypes}
            value={typeValue}
            onChange={(_, v) => setFilter('type', v ? v.id : null)} // si back espera name, cambia a v.name
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderInput={params => <CustomTextField {...params} label={t('Type')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Desde */}
        <Grid item xs={12} sm={6} md={3}>
          <CustomTextField
            fullWidth
            type='date'
            label={t('From')}
            value={filters.beginning ?? ''}
            onChange={e => setFilter('beginning', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Hasta */}
        <Grid item xs={12} sm={6} md={3}>
          <CustomTextField
            fullWidth
            type='date'
            label={t('To')}
            value={filters.end ?? ''}
            onChange={e => setFilter('end', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default TracingsFilters
