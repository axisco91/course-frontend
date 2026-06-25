import { Fragment } from 'react'
import { Button, Grid } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { certificationActions } from 'src/reducers/general/CertificationReducer'
import { RootState } from 'src/reducers/types/types'
import CustomTextField from 'src/views/components/CustomTextField'
import Filter from 'src/views/components/Filter'

const CertificationsFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const filters = useSelector((state: RootState) => state.certification.filters)

  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.management')

  const setFilter = (key: string, value: string) => dispatch(certificationActions.setFilter({ key, value }))

  const handleCreate = () => {
    dispatch(certificationActions.setId(null))
    dispatch(certificationActions.setName(''))
    dispatch(certificationActions.openModal({ mode: 'create', certificationId: null }))
  }

  const handleFilter = () => {
    dispatch(certificationActions.applyFilters())
    dispatch(generalActions.addFilterButtonClickCount())
  }

  const handleReset = () => {
    dispatch(certificationActions.resetFilters())
    dispatch(generalActions.addFilterButtonClickCount())
  }

  return (
    <Filter
      actions={
        <Fragment>
          {canCreate && (
            <Button variant='contained' sx={{ mr: 4 }} type='button' onClick={handleCreate}>
              <Icon icon='tabler:plus' fontSize={20} />
              {t('New')}
            </Button>
          )}

          <Button variant='contained' sx={{ mr: 4 }} type='button' color='secondary' onClick={handleReset}>
            <Icon icon='tabler:refresh' fontSize={20} />
            {t('Reset')}
          </Button>

          <Button variant='contained' sx={{ mr: 4 }} type='button' color='success' onClick={handleFilter}>
            <Icon icon='tabler:filter' fontSize={20} />
            {t('Filter')}
          </Button>
        </Fragment>
      }
    >
      <Grid container spacing={5}>
        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label='Código'
            placeholder='Código'
            value={filters.code ?? ''}
            onChange={e => setFilter('code', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <CustomTextField
            fullWidth
            label={t('Name')}
            placeholder={t('Name')}
            value={filters.name ?? ''}
            onChange={e => setFilter('name', e.target.value)}
          />
        </Grid>
      </Grid>
    </Filter>
  )
}

export default CertificationsFilters
