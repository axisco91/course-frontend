// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import Permission from 'src/views/components/Permission'
import PermissionsTable from 'src/views/management/permissions/PermissionsTable'
import { Card, CardContent } from '@mui/material'
import PermissionsFilters from 'src/views/management/permissions/PermissionsFilters'
import PermissionsDelete from 'src/views/management/permissions/PermissionsDelete'

const Permissions = () => {
  const { t } = useTranslation()

  return (
    <Permission requiredPermissions={['global.roles.index']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <PermissionsFilters />
            </CardContent>
            <CardContent>
              <PermissionsTable />
            </CardContent>
          </Card>
          <PermissionsDelete />
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Permissions
