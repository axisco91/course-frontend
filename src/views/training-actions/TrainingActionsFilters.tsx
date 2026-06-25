// ** React Imports
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Fragment, useContext, useMemo, useState } from 'react'

// ** MUI Imports
import { Button, Checkbox, FormControlLabel, Grid } from '@mui/material'
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
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer' // ✅ AJUSTA RUTA SI CAMBIA
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { getTrainingActionsExportExcel } from 'src/api/api'

type List = { id: number; name: string }

const TrainingActionsFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.training_actions')

  // ✅ draft filters
  const filters = useSelector((state: RootState) => (state as any).trainingAction.filters)

  // ✅ listas (ajusta keys si tu store usa otros nombres)
  const professionalFamilies = useSelector(
    (state: RootState) => (state as any).professionalFamily?.professionalFamilies ?? []
  ) as List[]
  const professionalAreas = useSelector(
    (state: RootState) => (state as any).professionalArea?.professionalAreas ?? []
  ) as List[]
  const modalities = useSelector((state: RootState) => (state as any).modality?.modalities ?? []) as List[]
  const providers = useSelector((state: RootState) => (state as any).provider?.providers ?? []) as List[]
  const courseOrigins = useSelector((state: RootState) => (state as any).courseOrigin?.courseOrigins ?? []) as List[]

  const setFilter = (key: string, value: any) => dispatch(trainingActionActions.setFilter({ key, value }))

  const findById = (list: List[], id: any) => (id == null ? null : list.find(x => Number(x.id) === Number(id)) ?? null)

  const selectedFamily = useMemo(
    () => findById(professionalFamilies, filters.professional_family),
    [professionalFamilies, filters.professional_family]
  )

  const selectedArea = useMemo(
    () => findById(professionalAreas, filters.professional_area),
    [professionalAreas, filters.professional_area]
  )

  const selectedModality = useMemo(() => findById(modalities, filters.modality), [modalities, filters.modality])

  const selectedProvider = useMemo(() => findById(providers, filters.provider), [providers, filters.provider])

  const selectedCourseOrigin = useMemo(
    () => findById(courseOrigins, filters.course_origin),
    [courseOrigins, filters.course_origin]
  )

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getTrainingActionsExportExcel(filters)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `accion_formativos_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
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
    dispatch(trainingActionActions.setId(null))
    dispatch(trainingActionActions.openModal({ mode: 'create', trainingActionId: null }))
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
              dispatch(trainingActionActions.resetFilters())
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
              dispatch(trainingActionActions.applyFilters())
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
        {/* Acción formativa */}
        <Grid item xs={12} md={3}>
          <CustomTextField
            fullWidth
            label={t('Training action')}
            placeholder={t('Training action')}
            value={filters.formative_action ?? ''}
            onChange={e => setFilter('formative_action', e.target.value)}
          />
        </Grid>

        {/* Nombre */}
        <Grid item xs={12} md={3}>
          <CustomTextField
            fullWidth
            label={t('Name')}
            placeholder={t('Name')}
            value={filters.name ?? ''}
            onChange={e => setFilter('name', e.target.value)}
          />
        </Grid>

        {/* Familia profesional */}
        <Grid item xs={12} md={3}>
          <Autocomplete
            options={professionalFamilies}
            value={selectedFamily}
            onChange={(_, v) => setFilter('professional_family', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => (
              <CustomTextField {...params} label={t('Professional family')} placeholder={t('Select...')} />
            )}
          />
        </Grid>

        {/* Área profesional */}
        <Grid item xs={12} md={3}>
          <Autocomplete
            options={professionalAreas}
            value={selectedArea}
            onChange={(_, v) => setFilter('professional_area', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => (
              <CustomTextField {...params} label={t('Professional area')} placeholder={t('Select...')} />
            )}
          />
        </Grid>

        {/* Modalidad */}
        <Grid item xs={12} md={3}>
          <Autocomplete
            options={modalities}
            value={selectedModality}
            onChange={(_, v) => setFilter('modality', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Modality')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Proveedor */}
        <Grid item xs={12} md={3}>
          <Autocomplete
            options={providers}
            value={selectedProvider}
            onChange={(_, v) => setFilter('provider', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => <CustomTextField {...params} label={t('Provider')} placeholder={t('Select...')} />}
          />
        </Grid>

        {/* Origen del curso */}
        <Grid item xs={12} md={3}>
          <Autocomplete
            options={courseOrigins}
            value={selectedCourseOrigin}
            onChange={(_, v) => setFilter('course_origin', v ? v.id : null)}
            getOptionLabel={(o: any) => o?.name ?? ''}
            isOptionEqualToValue={(o: any, v: any) => Number(o.id) === Number(v.id)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={params => (
              <CustomTextField {...params} label={t('Course origin')} placeholder={t('Select...')} />
            )}
          />
        </Grid>

        {/* Mostrar inactivo */}
        <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
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

export default TrainingActionsFilters
