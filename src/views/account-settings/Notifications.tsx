// ** React Imports
import { useState, Fragment, useEffect, useContext } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Third Party Imports
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

// ** Icon Imports
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Llamadas API
import { destroyUserNotification, storeUserNotification } from 'src/api/api'
import { CardContent, FormControlLabel, Switch } from '@mui/material'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/router'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { authActions } from 'src/reducers/users/AuthReducer'

const Notifications = () => {
  // Para el idioma
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // Obtenemos los permisos
  const notifications = useSelector((state: RootState) => state.auth.notifications)
  const activeCompanyId = useSelector((state: RootState) => state.activeCompany.id)

  // array de los switches
  const [notificationSwitches, setNotificationSwitches] = useState<{
    [key: string]: { enabled: boolean; notificationId: number }
  }>({})
  useEffect(() => {
    const initialSwitches: { [key: string]: { enabled: boolean; notificationId: number; userId: number } } = {}
    notifications.forEach(notification => {
      const enabled = notification.user_has_notification == 1 ? true : false
      initialSwitches[notification.id] = { enabled, notificationId: notification.id, userId: notification.user_id }
    })
    setNotificationSwitches(initialSwitches)
  }, [notifications])

  // Proceso de cambiar el estado de la alerta
  const handleChange = (notificationId: number, userId: number, hasNotification: number, checked: boolean) => {
    const formData = new FormData()
    formData.append('company_id', activeCompanyId ? activeCompanyId.toString() : '')
    formData.append('notification_id', notificationId ? notificationId.toString() : '')
    formData.append('user_id', userId ? userId.toString() : '')
    const data = {
      company_id: activeCompanyId,
      user_id: userId,
      notification_id: notificationId
    }

    if (hasNotification == 0) {
      storeUserNotification(formData)
        .then(response => {
          // Vemos si nos da un success y lo indicamos
          if (response.data.success) {
            dispatch(authActions.replaceUserNotifications(response.data.data.user_notification))
            setNotificationSwitches(prevSwitches => ({
              ...prevSwitches,
              [notificationId]: {
                ...prevSwitches[notificationId],
                enabled: checked,
                notificationId: response.data.data.user_notification.notification_id,
                userId: response.data.data.user_notification.user_id
              }
            }))
            toast.success(response.data.message)
          }
        })
        .catch(error => {
          handleError(error, logout)
        })
    } else {
      destroyUserNotification(notificationId, data)
        .then(response => {
          // Vemos si nos da un success y lo indicamos
          if (response.data.success) {
            dispatch(authActions.replaceUserNotifications(response.data.data.user_notification))
            if (response.data.data.user_notification.user_has_notification == 0) {
              toast.success(response.data.message)
              setNotificationSwitches(prevSwitches => ({
                ...prevSwitches,
                [notificationId]: {
                  ...prevSwitches[notificationId],
                  enabled: false,
                  notificationId: notificationId,
                  userId: userId
                }
              }))
            }
          }
        })
        .catch(error => {
          handleError(error, logout)
        })
    }
  }

  const switchArray = () => {
    return notifications.map(notification => (
      <Grid item xs={12} sm={3} key={notification.id}>
        <FormControlLabel
          labelPlacement='end'
          label={
            notification.notificationable_type.includes('EmailNotification')
              ? t('Email')
              : notification.notificationable_type.includes('SmsNotification')
              ? t('SMS')
              : t('Whatsapp')
          }
          control={
            <Switch
              checked={notificationSwitches[notification.id]?.enabled || false}
              onChange={e =>
                handleChange(
                  notification.id,
                  notification.user_id,
                  notification.user_has_notification,
                  e.target.checked
                )
              }
            />
          }
        />
      </Grid>
    ))
  }

  return (
    <Fragment>
      <CardContent>
        <Grid container spacing={5}>
          {switchArray()}
        </Grid>
      </CardContent>
    </Fragment>
  )
}

export default Notifications
