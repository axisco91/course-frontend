// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import AccessLogsTable from 'src/views/access-logs/AccessLogsTable'
import Permission from 'src/views/components/Permission'

const AccessLogs = () => {
  const { t } = useTranslation()

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <AccessLogsTable />
        </Grid>
      </Grid>
    </Permission>
  )
}

export default AccessLogs
