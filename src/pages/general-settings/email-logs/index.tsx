import Grid from '@mui/material/Grid'
import EmailLogsTable from 'src/views/email-logs/EmailLogsTable'
import Permission from 'src/views/components/Permission'

const EmailLogsPage = () => {
  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <EmailLogsTable />
        </Grid>
      </Grid>
    </Permission>
  )
}

export default EmailLogsPage
