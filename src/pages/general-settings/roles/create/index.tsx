// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'

import Permission from 'src/views/components/Permission'
import { useDispatch } from 'react-redux'
import { CardContent } from '@mui/material'
import { roleActions } from 'src/reducers/management/RoleReducer'
import RoleForm from 'src/views/management/roles/RoleForm'

const Role = () => {
  // Para el idioma
  const { t } = useTranslation()
  const dispatch = useDispatch()

  dispatch(roleActions.setRole(null))
  dispatch(roleActions.setId(null))

  return (
    <Permission requiredPermissions={['global.roles.create']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={t('Create Role')}></CardHeader>
            <CardContent>
              <RoleForm />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Role
