import { Fragment, useContext, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Button, Checkbox, FormControlLabel, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'
import DownloadElement from 'src/views/components/DownloadElement'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { studentActions } from 'src/reducers/students/StudentReducer'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { getStudentsExportExcel } from 'src/api/api'

type List = { id: number; name: string }

const StudentsFilters = () => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  const [loading, setLoading] = useState(false)

  // ✅ options vienen del reducer de companies
  const companies = useSelector((state: RootState) => state.company.companies) as List[]

  // ✅ draft filters
  const filters = useSelector((state: RootState) => state.student.filters)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]

  const companiesList = useMemo<List[]>(
    () => [{ id: 0, name: t('All the companies') }, ...(Array.isArray(companies) ? companies : [])],
    [companies, t]
  )

  const selectedCompany = useMemo<List | null>(() => {
    return companiesList.find(c => Number(c.id) === Number(filters.company_id)) ?? companiesList[0] ?? null
  }, [companiesList, filters.company_id])

  const setFilter = (key: string, value: any) => {
    dispatch(studentActions.setFilter({ key, value }))
  }

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getStudentsExportExcel(filters)

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

  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.students')

  const handleCreateStudent = () => {
    dispatch(studentActions.setId(null))
    dispatch(studentActions.openStudentModal({ mode: 'create', studentId: null }))
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
            <Button variant='contained' sx={{ mr: 4 }} type='button' onClick={handleCreateStudent}>
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
              dispatch(studentActions.resetFilters())
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
              dispatch(studentActions.applyFilters())
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
        <Grid item xs={12} sm={4}>
          <CustomTextField
            fullWidth
            label={t('Name')}
            placeholder={t('Name')}
            value={filters.name ?? ''}
            onChange={e => setFilter('name', e.target.value)}
          />
        </Grid>

        {/* Apellidos */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            fullWidth
            label={t('Surname')}
            placeholder={t('Surname')}
            value={filters.surname ?? ''}
            onChange={e => setFilter('surname', e.target.value)}
          />
        </Grid>

        {/* DNI */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            fullWidth
            label={t('Dni')}
            placeholder={t('Dni')}
            value={filters.dni ?? ''}
            onChange={e => setFilter('dni', e.target.value)}
          />
        </Grid>

        {/* Teléfono */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            fullWidth
            label={t('Phone')}
            placeholder={t('Phone')}
            value={filters.telephone ?? ''}
            onChange={e => setFilter('telephone', e.target.value)}
          />
        </Grid>

        {/* Correo */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            fullWidth
            label={t('Email')}
            placeholder={t('Email')}
            value={filters.email ?? ''}
            onChange={e => setFilter('email', e.target.value)}
          />
        </Grid>

        {/* Empresa */}
        <Grid item xs={12} sm={4}>
          <Autocomplete
            autoHighlight
            id='companies'
            value={selectedCompany}
            options={companiesList}
            getOptionLabel={option => option?.name ?? ''}
            isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
            renderInput={params => <CustomTextField {...params} label={t('Company')} placeholder={t('Select...')} />}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            onChange={(_, newValue) => {
              setFilter('company_id', newValue?.id ?? 0)
            }}
          />
        </Grid>

        {/* Mostrar Inactivo */}
        <Grid item xs={12}>
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

export default StudentsFilters
