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

// ** Redux actions
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { getCoursesExportExcel } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

type List = { id: number; name: string }

const CoursesFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [loading, setLoading] = useState(false)

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.courses')

  // ✅ draft filters del slice courses
  const filters = useSelector((state: RootState) => (state as any).course.filters)

  // ✅ listas desde reducers (AJUSTA keys si son distintos en tu store)
  const companies = useSelector((state: RootState) => (state as any).company?.companies ?? []) as List[]
  const modalities = useSelector((state: RootState) => (state as any).modality?.modalities ?? []) as List[]
  const courseTypes = useSelector((state: RootState) => (state as any).courseType?.courseTypes ?? []) as List[]
  const courseStatuses = useSelector((state: RootState) => (state as any).courseStatus?.courseStatuses ?? []) as List[]

  // ✅ helpers
  const setFilter = (key: string, value: any) => dispatch(courseActions.setFilter({ key, value }))
  const findById = (list: List[], id: any) => (id == null ? null : list.find(x => Number(x.id) === Number(id)) ?? null)

  // ✅ selected values para Autocomplete
  const selectedType = useMemo(() => findById(courseTypes, filters.type), [courseTypes, filters.type])
  const selectedModality = useMemo(() => findById(modalities, filters.modality), [modalities, filters.modality])
  const selectedStatus = useMemo(() => findById(courseStatuses, filters.status), [courseStatuses, filters.status])
  const selectedCompany = useMemo(() => findById(companies, filters.company), [companies, filters.company])

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getCoursesExportExcel(filters)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cursos_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.log(err)
      handleError(err, logout)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    dispatch(courseActions.setId(null))
    dispatch(courseActions.openModal({ mode: 'create', courseId: null }))
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
              dispatch(courseActions.resetFilters())
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
              dispatch(courseActions.applyFilters())
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
        {/* Acción Formativa */}
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Formative Action')}
            placeholder={t('Formative Action')}
            value={filters.formative_action ?? ''}
            onChange={e => setFilter('formative_action', e.target.value)}
          />
        </Grid>

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

        {/* Grupo */}
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Group')}
            placeholder={t('Group')}
            value={filters.group ?? ''}
            onChange={e => setFilter('group', e.target.value)}
          />
        </Grid>

        {/* Tipo */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={courseTypes}
            value={selectedType}
            onChange={(_, v) => setFilter('type', v ? v.id : null)}
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

        {/* Modalidad */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={modalities}
            value={selectedModality}
            onChange={(_, v) => setFilter('modality', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o?.id) === Number(v?.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Modality')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Estado (course_status desde BD) */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={courseStatuses}
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
      </Grid>
    </Filter>
  )
}

export default CoursesFilters
