import { Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Box, Button, Dialog, DialogContent, DialogTitle, Grid, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { getAdvisorCommission } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { advisorCommissionActions } from 'src/reducers/advisors/AdvisorCommissionReducer'

const toText = (v: any) => (v == null ? '' : String(v))
const fullName = (x: any) => [x?.name, x?.surname].filter(Boolean).join(' ').trim()

const normalizeCommission = (raw: any) => {
  if (!raw || typeof raw !== 'object') return null

  return {
    name: raw?.name ?? raw?.advisor_name ?? raw?.advisor?.full_name ?? fullName(raw?.advisor),
    commission_type:
      raw?.commission_type ??
      raw?.commission_type_name ??
      raw?.commission_type?.name ??
      raw?.type ??
      raw?.advisor_commission_type?.name,
    percentage: raw?.percentage ?? raw?.commission_percentage,
    amount: raw?.amount ?? raw?.commission_amount,
    bill_amount: raw?.bill_amount ?? raw?.total ?? raw?.total_amount
  }
}

const pickCommissionFromResponse = (res: any, commissionId: number | null) => {
  const data = res?.data?.data ?? res?.data ?? null

  const direct =
    data?.advisor_commission ??
    data?.commission ??
    data?.advisorCommission ??
    (Array.isArray(data?.advisor_commissions)
      ? data.advisor_commissions.find((x: any) => Number(x?.id) === Number(commissionId)) ?? data.advisor_commissions[0]
      : null) ??
    (Array.isArray(data) ? data.find((x: any) => Number(x?.id) === Number(commissionId)) ?? data[0] : null) ??
    data

  return normalizeCommission(direct)
}

const AdvisorCommissionModal = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])
  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const modalOpen = useSelector((state: any) => state.advisorCommission?.modalOpen)
  const commissionId = useSelector((state: any) => state.advisorCommission?.id)
  const currentAdvisorCommission = useSelector((state: any) => state.advisorCommission?.currentAdvisorCommission)

  const [loading, setLoading] = useState(false)
  const [item, setItem] = useState<any>(null)

  const close = useCallback(() => {
    dispatch(
      advisorCommissionActions.closeAdvisorCommissionModal?.() ?? advisorCommissionActions.closeModal?.()
    )
  }, [dispatch])

  useEffect(() => {
    if (!modalOpen) {
      setItem(null)

      return
    }

    if (currentAdvisorCommission && Number(currentAdvisorCommission?.id) === Number(commissionId)) {
      setItem(normalizeCommission(currentAdvisorCommission))
    }
  }, [modalOpen, commissionId, currentAdvisorCommission])

  useEffect(() => {
    if (!modalOpen) return
    if (!commissionId) return

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await getAdvisorCommission(commissionId)
        if (cancelled) return

        const data = pickCommissionFromResponse(res, commissionId)
        if (data) setItem(data)
      } catch (e) {
        if (!cancelled) handleErrorRef.current(e, logoutRef.current)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [modalOpen, commissionId])

  return (
    <Fragment>
      <Dialog open={Boolean(modalOpen)} onClose={close} fullWidth maxWidth='md'>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant='h6'>{t('Commission')}</Typography>
          <Button onClick={close} startIcon={<Icon icon='tabler:x' />}>
            {t('Close')}
          </Button>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  label={t('Name')}
                  value={toText(item?.name)}
                  disabled
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  label={t('Commission type')}
                  value={toText(item?.commission_type)}
                  disabled
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label={t('Percentage')}
                  value={toText(item?.percentage)}
                  disabled
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomTextField fullWidth label={t('Amount')} value={toText(item?.amount)} disabled />
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomTextField fullWidth label={t('Total')} value={toText(item?.bill_amount)} disabled />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default AdvisorCommissionModal
