// Tracings.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import { Card, CardContent } from '@mui/material'

import { RootState } from 'src/reducers/types/types'
import PaymentsFilters from 'src/views/payments/PaymentsFilters'
import PaymentsTable from 'src/views/payments/PaymentsTable'
import PaymentsModel from 'src/views/payments/PaymentsModal'
import PaymentsDelete from 'src/views/payments/PaymentsDelete'
import { paymentActions } from 'src/reducers/general/PaymentReducer'

const Payments = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const modalOpen = useSelector((state: RootState) => state.payment.modalOpen)
  const modalMode = useSelector((state: RootState) => state.payment.modalMode)
  const id = useSelector((state: RootState) => state.payment.id)

  useEffect(() => {
    dispatch(paymentActions.closeModal?.())
    dispatch(paymentActions.setId?.(null))
  }, [dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <PaymentsFilters />
            </CardContent>

            <CardContent>
              <PaymentsTable />
            </CardContent>

            <PaymentsModel
              open={modalOpen}
              mode={modalMode}
              paymentId={id}
              onClose={() =>
                dispatch(
                  paymentActions.closeModal?.() ?? {
                    type: 'payment/closeModal'
                  }
                )
              }
            />

            <PaymentsDelete />
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Payments
