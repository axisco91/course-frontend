import { Fragment, useMemo } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Button, Grid } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'
import { potentialStudentActions } from 'src/reducers/students/PotentialStudentReducer'
import { generalActions } from 'src/reducers/general/GeneralReducer'

type List = { id: number; name: string }

const PotentialStudentsFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const companies = useSelector((state: RootState) => state.company.companies) as List[]
  const filters = useSelector((state: RootState) => state.potentialStudent.filters) as any
  const companiesList = useMemo<List[]>(
    () => [{ id: 0, name: t('All the companies') }, ...(Array.isArray(companies) ? companies : [])],
    [companies, t]
  )

  const selectedCompany = useMemo<List | null>(() => {
    return companiesList.find(c => Number(c.id) === Number(filters.company_id)) ?? companiesList[0] ?? null
  }, [companiesList, filters.company_id])

  const setFilter = (key: string, value: any) => {
    dispatch(potentialStudentActions.setFilter({ key, value }))
  }

  return (
    <Filter
      actions={
        <Fragment>
          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='button'
            color='warning'
            onClick={() => dispatch(potentialStudentActions.changeSendEmailModalStatus())}
          >
            <Icon icon='tabler:mail' fontSize={20} />
            {t('Send email')}
          </Button>

          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='button'
            color='warning'
            onClick={() => dispatch(potentialStudentActions.changeSendBonusEmailModalStatus())}
          >
            <Icon icon='tabler:mail-forward' fontSize={20} />
            {t('Send bonus email')}
          </Button>

          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='button'
            color='secondary'
            onClick={() => {
              dispatch(potentialStudentActions.resetFilters())
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
              dispatch(potentialStudentActions.applyFilters())
              dispatch(generalActions.addFilterButtonClickCount())
            }}
          >
            <Icon icon='tabler:filter' fontSize={20} />
            {t('Filter')}
          </Button>
        </Fragment>
      }
    >
      <Grid container spacing={5}>
        <Grid item xs={12} sm={4}>
          <CustomTextField
            fullWidth
            label={t('Name')}
            placeholder={t('Name')}
            value={filters.name ?? ''}
            onChange={e => setFilter('name', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <CustomTextField
            fullWidth
            label={t('Surname')}
            placeholder={t('Surname')}
            value={filters.surname ?? ''}
            onChange={e => setFilter('surname', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <CustomTextField
            fullWidth
            label={t('Dni')}
            placeholder={t('Dni')}
            value={filters.dni ?? ''}
            onChange={e => setFilter('dni', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <CustomTextField
            fullWidth
            label={t('Phone')}
            placeholder={t('Phone')}
            value={filters.telephone ?? ''}
            onChange={e => setFilter('telephone', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <CustomTextField
            fullWidth
            label={t('Email')}
            placeholder={t('Email')}
            value={filters.email ?? ''}
            onChange={e => setFilter('email', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Autocomplete
            autoHighlight
            id='potential-students-companies'
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
      </Grid>
    </Filter>
  )
}

export default PotentialStudentsFilters
