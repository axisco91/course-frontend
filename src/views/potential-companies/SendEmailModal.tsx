import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { potentialCompanyActions } from 'src/reducers/company/PotentialCompanyReducer'
import { sendPotentialCompany } from 'src/api/api'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useTranslation } from 'react-i18next'
import { useContext, useState } from 'react'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { toast } from 'react-hot-toast'

const SendEmailModal = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const open = useSelector((state: RootState) => (state.potentialCompany as any).showSendEmailModal)
  const [saving, setSaving] = useState(false)

  const schema = yup.object().shape({ email: yup.string().email().required(t('Email required')) })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ defaultValues: { email: '' }, resolver: yupResolver(schema) })

  const close = () => {
    dispatch(potentialCompanyActions.changeSendEmailModalStatus())
    reset({ email: '' })
  }

  const onSubmit = async (data: { email: string }) => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('email', data.email)
      const response = await sendPotentialCompany(formData)
      if (response?.status === 200) {
        toast.success(t('Email sent'))
        close()
      }
    } catch (error) {
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(open)} onClose={close} fullWidth maxWidth='sm'>
      <DialogTitle>{t('Send email')}</DialogTitle>
      <DialogContent>
        <Controller
          name='email'
          control={control}
          render={({ field }) => (
            <CustomTextField
              autoFocus
              fullWidth
              sx={{ mt: 2 }}
              label={t('Email')}
              {...field}
              error={Boolean(errors.email)}
              helperText={errors.email?.message as string}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button color='secondary' onClick={close}>
          {t('Close')}
        </Button>
        <Button variant='contained' onClick={handleSubmit(onSubmit)} disabled={saving}>
          {t('Send')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SendEmailModal
