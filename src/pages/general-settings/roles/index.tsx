// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import Permission from 'src/views/components/Permission'
import RolesTable from 'src/views/management/roles/RolesTable'
import { Card, CardContent } from '@mui/material'
import RolesDelete from 'src/views/management/roles/RolesDelete'
import RolesFilters from 'src/views/management/roles/RolesFilters'

const Roles = () => {
  const { t } = useTranslation()

  return (
    <Permission requiredPermissions={['global.roles.index']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <RolesFilters />
            </CardContent>
            <CardContent>
              <RolesTable />
            </CardContent>
          </Card>
          <RolesDelete />
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Roles
