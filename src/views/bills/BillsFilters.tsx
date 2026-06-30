// BillsFilters.tsx
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Button, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'
import DownloadElement from 'src/views/components/DownloadElement'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { billActions } from 'src/reducers/bills/BillReducer'

// ✅ API (ajusta nombres)
import { getBillsExportExcel, getBillsMinYear } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

type Option = { id: number; name: string }
type YearOption = { id: number; name: string }

const getCourseOptionLabel = (option: any) => option?.name ?? option?.label ?? ''

const buildBillRequestFilters = (filters: any) => {
  const { course, course_text, ...rest } = filters ?? {}
  const nextFilters = { ...rest }

  if (course != null && course !== '') {
    nextFilters.course = course
  } else if (typeof course_text === 'string' && course_text.trim() !== '') {
    nextFilters.course = course_text.trim()
  }

  return nextFilters
}

const BillsFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)

  // ✅ draft + applied
  const filters = useSelector((state: RootState) => (state as any).bill.filters)
  const appliedFilters = useSelector((state: RootState) => (state as any).bill.appliedFilters)

  // ✅ listas desde reducers
  const courses = useSelector((state: RootState) => (state as any).course.courses ?? []) as Option[]
  const companies = useSelector((state: RootState) => (state as any).company.companies ?? []) as Option[]

  // ✅ Tipo fijo (captura)
  // id: null => All (lo manejamos como -1 en el select)
  // id: 0 => No bonificada
  // id: 1 => Bonificada
  const billTypes = useMemo<Option[]>(
    () => [
      { id: -1, name: t('All') },
      { id: 0, name: t('No bonificada') },
      { id: 1, name: t('Bonificada') }
    ],
    [t]
  )

  // ✅ select fijo: Facturado / Cobrado
  const yesNoAll = useMemo(
    () => [
      { id: -1, name: t('All') },
      { id: 1, name: t('Yes') },
      { id: 0, name: t('No') }
    ],
    [t]
  )

  // ✅ años desde backend
  const [years, setYears] = useState<YearOption[]>([{ id: -1, name: t('All') }])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await getBillsMinYear()
        const minYear = Number(res.data?.data?.minYear ?? res.data?.minYear ?? new Date().getFullYear())
        const currentYear = new Date().getFullYear()
        const list: YearOption[] = [{ id: -1, name: t('All') }]
        for (let y = currentYear; y >= minYear; y--) list.push({ id: y, name: String(y) })
        if (mounted) setYears(list)
      } catch {
        if (mounted)
          setYears([
            { id: -1, name: t('All') },
            { id: new Date().getFullYear(), name: String(new Date().getFullYear()) }
          ])
      }
    })()

    return () => {
      mounted = false
    }
  }, [t])

  // ✅ helpers
  const setFilter = (key: string, value: any) => dispatch(billActions.setFilter({ key, value }))

  const findById = (list: any[], id: any) => {
    if (id == null) return list.find(x => Number(x.id) === -1) ?? null

    return list.find(x => Number(x.id) === Number(id)) ?? null
  }

  // selected values
  const selectedCourse = useMemo(() => findById(courses, filters.course), [courses, filters.course])
  const selectedCompany = useMemo(() => findById(companies, filters.company), [companies, filters.company])

  // ✅ type: null => All, 0/1 => opciones
  const selectedType = useMemo(() => {
    const v = filters.type
    const id = v == null ? -1 : Number(v)

    return billTypes.find(x => x.id === id) ?? billTypes[0]
  }, [filters.type, billTypes])

  const selectedInvoiced = useMemo(() => {
    const v = filters.invoiced
    const id = v == null ? -1 : Number(v)

    return yesNoAll.find(x => x.id === id) ?? yesNoAll[0]
  }, [filters.invoiced, yesNoAll])

  const selectedPaid = useMemo(() => {
    const v = filters.paid
    const id = v == null ? -1 : Number(v)

    return yesNoAll.find(x => x.id === id) ?? yesNoAll[0]
  }, [filters.paid, yesNoAll])

  const selectedYear = useMemo(() => {
    const v = filters.year
    const id = v == null ? -1 : Number(v)

    return years.find(x => Number(x.id) === id) ?? years[0]
  }, [filters.year, years])

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getBillsExportExcel(buildBillRequestFilters(appliedFilters))

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `facturas_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
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
          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='button'
            color='info'
            onClick={() => dispatch(billActions.setShowTable(false))}
          >
            <Icon icon='tabler:eye' fontSize={20} />
            {t('Training Contract Bills')}
          </Button>
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
              dispatch(billActions.resetFilters())
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
              dispatch(billActions.applyFilters())
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
            freeSolo
            options={courses}
            value={selectedCourse}
            inputValue={filters.course_text ?? ''}
            onChange={(_, v) => {
              const nextCourse = typeof v === 'object' && v ? v.id : null
              const nextText = typeof v === 'string' ? v : getCourseOptionLabel(v)
              setFilter('course', nextCourse)
              setFilter('course_text', nextText)
            }}
            onInputChange={(_, value, reason) => {
              setFilter('course_text', value)

              if (!selectedCourse) return

              const selectedLabel = getCourseOptionLabel(selectedCourse)

              if (reason === 'clear' || value !== selectedLabel) {
                setFilter('course', null)
              }
            }}
            getOptionLabel={getCourseOptionLabel}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {getCourseOptionLabel(option)}
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

        {/* Tipo (fijo) */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={billTypes}
            value={selectedType}
            onChange={(_, v) => setFilter('type', !v || v.id === -1 ? null : v.id)} // ✅ null => All
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Type')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Facturado */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={yesNoAll}
            value={selectedInvoiced}
            onChange={(_, v) => setFilter('invoiced', !v || v.id === -1 ? null : v.id)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Invoiced')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Cobrado */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={yesNoAll}
            value={selectedPaid}
            onChange={(_, v) => setFilter('paid', !v || v.id === -1 ? null : v.id)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Paid')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Año */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={years}
            value={selectedYear}
            onChange={(_, v) => setFilter('year', !v || v.id === -1 ? null : v.id)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Year')} placeholder={t('Select...')} />}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default BillsFilters
