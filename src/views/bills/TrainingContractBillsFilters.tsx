// TrainingContractBillsFilters.tsx
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
import { trainingContractBillActions } from 'src/reducers/bills/TrainingContractBillReducer'

// ✅ API (ajusta nombres a tus exports reales)
import { getTrainingContractBillsExportExcel, getTrainingContractBillYears } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { billActions } from 'src/reducers/bills/BillReducer'

type Option = { id: number; name: string }
type YearOption = { id: number; name: string }
type MonthOption = { id: number; name: string }

const TrainingContractBillsFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)

  // ✅ draft filters (en tu reducer nuevo)
  const filters = useSelector((state: RootState) => (state as any).trainingContractBill.filters)

  // ✅ listas desde reducers (para empresa / alumno si las tienes)
  const companies = useSelector((state: RootState) => (state as any).company.companies ?? []) as Option[]
  const students = useSelector((state: RootState) => (state as any).student.students ?? []) as Option[]

  // ✅ Sí/No/All para chips/filtro
  const yesNoAll = useMemo(
    () => [
      { id: -1, name: t('All') },
      { id: 1, name: t('Yes') },
      { id: 0, name: t('No') }
    ],
    [t]
  )

  // ✅ meses (si en backend te viene número 1-12, aquí lo mapeas)
  const months = useMemo<MonthOption[]>(
    () => [
      { id: -1, name: t('All') },
      { id: 1, name: t('January') },
      { id: 2, name: t('February') },
      { id: 3, name: t('March') },
      { id: 4, name: t('April') },
      { id: 5, name: t('May') },
      { id: 6, name: t('June') },
      { id: 7, name: t('July') },
      { id: 8, name: t('August') },
      { id: 9, name: t('September') },
      { id: 10, name: t('October') },
      { id: 11, name: t('November') },
      { id: 12, name: t('December') }
    ],
    [t]
  )

  // ✅ años desde backend
  const [years, setYears] = useState<YearOption[]>([{ id: -1, name: t('All') }])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const res = await getTrainingContractBillYears()

        // Tu endpoint devuelve: [{ value, label }]
        const apiYears = (res.data ?? res.data?.data ?? []) as Array<{ value: number; label: string }>

        const list: YearOption[] = [
          { id: -1, name: t('All') },
          ...apiYears
            .filter(y => y?.value != null)
            .map(y => ({ id: Number(y.value), name: String(y.label ?? y.value) }))
        ]

        if (mounted) setYears(list)
      } catch (err) {
        if (mounted) {
          setYears([
            { id: -1, name: t('All') },
            { id: new Date().getFullYear(), name: String(new Date().getFullYear()) }
          ])
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [t])

  // ✅ helpers
  const setFilter = (key: string, value: any) => dispatch(trainingContractBillActions.setFilter({ key, value }))

  const findById = (list: any[], id: any) => {
    if (id == null) return null

    return list.find(x => Number(x.id) === Number(id)) ?? null
  }

  // selected values
  const selectedCompany = useMemo(() => findById(companies, filters.company_id), [companies, filters.company_id])
  const selectedStudent = useMemo(() => findById(students, filters.student_id), [students, filters.student_id])

  const selectedMonth = useMemo(() => {
    const v = filters.month
    const id = v == null ? -1 : Number(v)

    return months.find(x => x.id === id) ?? months[0]
  }, [filters.month, months])

  const selectedYear = useMemo(() => {
    const v = filters.year
    const id = v == null ? -1 : Number(v)

    return years.find(x => Number(x.id) === id) ?? years[0]
  }, [filters.year, years])

  const selectedInvoiced = useMemo(() => {
    const v = filters.invoiced
    const id = v == null ? -1 : Number(v)

    return yesNoAll.find(x => x.id === id) ?? yesNoAll[0]
  }, [filters.invoiced, yesNoAll])

  const selectedCharged = useMemo(() => {
    const v = filters.charged
    const id = v == null ? -1 : Number(v)

    return yesNoAll.find(x => x.id === id) ?? yesNoAll[0]
  }, [filters.charged, yesNoAll])

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getTrainingContractBillsExportExcel(filters)

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
            onClick={() => dispatch(billActions.setShowTable(true))}
          >
            <Icon icon='tabler:eye' fontSize={20} />
            {t('Bills')}
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
              dispatch(trainingContractBillActions.resetFilters())
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
              dispatch(trainingContractBillActions.applyFilters())
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
        {/* Alumno */}
        <Grid item xs={12} md={3}>
          <Autocomplete
            options={students}
            value={selectedStudent}
            onChange={(_, v) => setFilter('student_id', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? o?.label ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name} {option.surname}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Student')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Empresa */}
        <Grid item xs={12} md={3}>
          <Autocomplete
            options={companies}
            value={selectedCompany}
            onChange={(_, v) => setFilter('company_id', v ? v.id : null)}
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

        {/* Mes */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={months}
            value={selectedMonth}
            onChange={(_, v) => setFilter('month', !v || v.id === -1 ? null : v.id)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Month')} placeholder={t('Select...')} />}
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

        {/* Facturado */}
        <Grid item xs={12} md={2}>
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
        <Grid item xs={12} md={2}>
          <Autocomplete
            options={yesNoAll}
            value={selectedCharged}
            onChange={(_, v) => setFilter('charged', !v || v.id === -1 ? null : v.id)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Charged')} placeholder={t('Select...')} />}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default TrainingContractBillsFilters
