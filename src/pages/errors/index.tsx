// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { useTranslation } from 'react-i18next'
import Permission from 'src/views/components/Permission'

import { CalendarStyleSheets } from 'src/views/components/StyleSheets'
import { Card, CardContent } from '@mui/material'
import ErrorLogTable from 'src/views/errorLog/ErrorLogTable'

const errorLogs = () => {
  const { t } = useTranslation()

  return (
    <Permission requiredPermissions={['global.errors']}>
      <CalendarStyleSheets />
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ErrorLogTable />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default errorLogs
