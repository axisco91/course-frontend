// ** React Imports
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Fragment, useContext, useMemo, useState } from 'react'

// ** MUI Imports
import { Button, Checkbox, FormControlLabel, Grid } from '@mui/material'
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
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { getTeachersExportExcel } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

type List = { id: number; name: string }

const TeachersFilters = () => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]

  // ✅ draft filters (NO applied aquí)
  const filters = useSelector((state: RootState) => state.teacher.filters)

  // ✅ áreas desde su reducer (AJUSTA si tu reducer se llama distinto)
  const areas = useSelector((state: RootState) => state.teacherArea.teacherAreas) as List[]
  const areasList = useMemo<List[]>(() => (Array.isArray(areas) ? areas : []), [areas])

  const selectedArea = useMemo<List | null>(() => {
    if (!filters.area) return null

    return areasList.find(a => Number(a.id) === Number(filters.area)) ?? null
  }, [areasList, filters.area])

  const [loading, setLoading] = useState(false)

  const setFilter = (key: string, value: any) => {
    dispatch(teacherActions.setFilter({ key, value }))
  }

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getTeachersExportExcel(filters)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `docentes_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
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

  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.teachers')

  const handleCreate = () => {
    dispatch(teacherActions.setId(null))
    dispatch(teacherActions.openModal({ mode: 'create', teacherId: null }))
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
              dispatch(teacherActions.resetFilters())
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
              dispatch(teacherActions.applyFilters())
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

        {/* Apellidos */}
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Surname')}
            placeholder={t('Surname')}
            value={filters.surname ?? ''}
            onChange={e => setFilter('surname', e.target.value)}
          />
        </Grid>

        {/* DNI */}
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Dni')}
            placeholder={t('Dni')}
            value={filters.dni ?? ''}
            onChange={e => setFilter('dni', e.target.value)}
          />
        </Grid>

        {/* Teléfono */}
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Phone')}
            placeholder={t('Phone')}
            value={filters.telephone ?? ''}
            onChange={e => setFilter('telephone', e.target.value)}
          />
        </Grid>

        {/* Correo */}
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Email')}
            placeholder={t('Email')}
            value={filters.email ?? ''}
            onChange={e => setFilter('email', e.target.value)}
          />
        </Grid>

        {/* Área (Autocomplete) */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            autoHighlight
            id='areas'
            options={areasList}
            value={selectedArea}
            getOptionLabel={option => option?.name ?? ''}
            isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
            renderInput={params => <CustomTextField {...params} label={t('Area')} placeholder={t('Select...')} />}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            onChange={(_, newValue) => {
              setFilter('area', newValue?.id ?? null) // ✅ guardamos ID
            }}
          />
        </Grid>

        {/* Mostrar inactivo */}
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

export default TeachersFilters
