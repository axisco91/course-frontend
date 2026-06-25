import { Fragment, useContext, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Button, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useTranslation } from 'react-i18next'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'
import DownloadElement from 'src/views/components/DownloadElement'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { choreActions } from 'src/reducers/chores/ChoreReducer'
import { getChoresExportExcel } from 'src/api/api'

type Option = { id: number; name: string }

// helper: Autocomplete value -> option
const findById = (list: Option[], id: number | null | undefined) => {
  if (!id) return null

  return list.find(i => Number(i.id) === Number(id)) ?? null
}

const ChoresFilters = () => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  const [loading, setLoading] = useState(false)

  // ✅ LISTAS vienen de sus reducers
  const courses = useSelector((state: RootState) => state.course.courses)
  const companies = useSelector((state: RootState) => state.company.companies)
  const students = useSelector((state: RootState) => state.student.students)
  const statuses = useSelector((state: RootState) => state.courseStatus.courseStatuses)
  const types = useSelector((state: RootState) => state.courseType.courseTypes)

  // ✅ selección guardada en reducer de chores
  const filters = useSelector((state: RootState) => state.chore.filters)

  const courseValue = useMemo(() => findById(courses, filters.course), [courses, filters.course])
  const companyValue = useMemo(() => findById(companies, filters.company), [companies, filters.company])
  const studentValue = useMemo(() => findById(students, filters.student), [students, filters.student])
  const statusValue = useMemo(() => findById(statuses, filters.status), [statuses, filters.status])
  const typeValue = useMemo(() => findById(types, filters.type), [types, filters.type])

  const setFilter = (key: string, value: any) => {
    dispatch(choreActions.setFilter({ key, value }))
  }

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getChoresExportExcel(filters)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tareas_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
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
              dispatch(choreActions.resetFilters())
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
              dispatch(choreActions.applyFilters())
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
            getOptionLabel={(o: any) => {
              if (!o) return ''

              // si tu API ya trae label compuesto, úsalo
              if (o.label) return String(o.label)

              const name = o?.name ?? ''
              const group = o?.group ?? ''

              return group ? `${group} / ${name}` : name
            }}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            openOnFocus
            clearOnBlur={false}
            disablePortal
            renderInput={params => (
              <CustomTextField
                {...params}
                label={t('Course')}
                placeholder={t('Select...')}
                onClick={() => {
                  params.inputProps?.onFocus?.({} as any)
                }}
              />
            )}
          />
        </Grid>

        {/* Empresa */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={companies as Option[]}
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
            options={students as any[]}
            value={studentValue}
            onChange={(_, v: any) => setFilter('student', v ? v.id : null)}
            getOptionLabel={(o: any) => {
              // por si en students tienes name/surname
              const name = o?.name ?? ''
              const surname = o?.surname ?? o?.last_name ?? ''
              const full = `${name} ${surname}`.trim()

              return full || o?.label || ''
            }}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderInput={params => <CustomTextField {...params} label={t('Student')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Estado */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={statuses as Option[]}
            value={statusValue}
            onChange={(_, v) => setFilter('status', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => String(o?.name) === String(v?.name)}
            renderInput={params => <CustomTextField {...params} label={t('Status')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Tipo */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={types as Option[]}
            value={typeValue}
            onChange={(_, v) => setFilter('type', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => String(o?.name) === String(v?.name)}
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

export default ChoresFilters
