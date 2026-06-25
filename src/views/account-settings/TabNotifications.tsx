// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Custom Component Import
import Notifications from './Notifications'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { RootState } from 'src/reducers/types/types'
import { fetchUserNotifications } from 'src/api/api'
import { authActions } from 'src/reducers/users/AuthReducer'

const TabNotifications = () => {
  // Para el idioma
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const activeCompanyId = useSelector((state: RootState) => state.activeCompany.id)

  useEffect(() => {
    const fetchGeneralData = async () => {
      await fetchUserNotifications({ company_id: activeCompanyId })
        .then(res => {
          dispatch(authActions.setNotifications(res.data.data.user_notifications))
          setShow(true)
        })
        .catch()
      setLoading(false)
    }

    // hacemos este if para que solo se haga las llamada una vez
    if (loading) {
      fetchGeneralData()
    }
  }, [dispatch, loading])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={t('Notifications')}></CardHeader>
          <CardContent>{show && <Notifications />}</CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TabNotifications
