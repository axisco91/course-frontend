// ** React Imports
import { Fragment } from 'react'

// ** MUI Imports
import { Button, Grid } from '@mui/material'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Components
import Filter from '../components/Filter'
import Icon from 'src/@core/components/icon'

// ** Utils
import { generalActions } from 'src/reducers/general/GeneralReducer'
import CustomTextField from '../components/CustomTextField'
import { paymentActions } from 'src/reducers/general/PaymentReducer'

const PaymentsFilters = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]

  const canCreate = Array.isArray(userPermissions) && userPermissions.includes('create.management')

  const filters = useSelector((state: RootState) => (state as any).payment.filters)

  const handleCreate = () => {
    dispatch(paymentActions.setId(null))

    // ✅ abre modal en create
    dispatch(paymentActions.openModal({ mode: 'create', paymentId: null }))
  }

  const setFilter = (key: string, value: any) => dispatch(paymentActions.setFilter({ key, value }))

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
          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='submit'
            color='success'
            onClick={() => {
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

export default PaymentsFilters
