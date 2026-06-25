// ** React Imports
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Fragment, useContext, useMemo, useState } from 'react'

// ** MUI Imports
import { Button, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'

// ** i18n
import { useTranslation } from 'react-i18next'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Components
import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'
import DownloadElement from 'src/views/components/DownloadElement'

// ** Redux
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer' // ✅ AJUSTA RUTA
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { getTrainingContractsExportExcel } from 'src/api/api'

type List = { id: number; name: string }

const TrainingContractsFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [loading, setLoading] = useState(false)

  // ✅ draft filters
  const filters = useSelector((state: RootState) => (state as any).trainingContract.filters)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.training_contracts')

  // ✅ listas desde reducers (ajusta keys si cambian)
  const companies = useSelector((state: RootState) => (state as any).company?.companies ?? []) as List[]
  const students = useSelector((state: RootState) => (state as any).student?.students ?? []) as List[]
  const statuses = useSelector(
    (state: RootState) => (state as any).trainingContractStatus?.trainingContractStatuses ?? []
  ) as List[]

  // ✅ helpers
  const setFilter = (key: string, value: any) => dispatch(trainingContractActions.setFilter({ key, value }))
  const findById = (list: List[], id: any) => (id == null ? null : list.find(x => Number(x.id) === Number(id)) ?? null)
  const realCompanies = useMemo(
    () =>
      companies.filter(
        (company: any) =>
          Number(company?.potential ?? 0) === 0 &&
          Number(company?.active ?? 1) === 1 &&
          String(company?.status ?? '').toLowerCase() !== 'potencial'
      ),
    [companies]
  )

  // ✅ selected values
  const selectedCompany = useMemo(() => findById(realCompanies, filters.company), [realCompanies, filters.company])
  const selectedStudent = useMemo(() => findById(students, filters.student), [students, filters.student])
  const selectedStatus = useMemo(
    () => (filters.status == null ? null : statuses.find(s => Number(s.id) === Number(filters.status)) ?? null),
    [filters.status, statuses]
  )

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getTrainingContractsExportExcel(filters)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contratos_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
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
    dispatch(trainingContractActions.setId(null))
    dispatch(trainingContractActions.openModal({ mode: 'create', trainingContractId: null }))
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
              dispatch(trainingContractActions.resetFilters())
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
              dispatch(trainingContractActions.applyFilters())
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
        {/* Empresa */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={realCompanies}
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

        {/* Alumno */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={students}
            value={selectedStudent}
            onChange={(_, v) => setFilter('student', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name + ' ' + o?.surname ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name} {option.surname}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Student')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Estado */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={statuses}
            value={selectedStatus}
            onChange={(_, v) => setFilter('status', v ? v.id : null)}
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

export default TrainingContractsFilters
