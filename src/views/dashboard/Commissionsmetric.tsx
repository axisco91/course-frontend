import { useState } from 'react'
import { Card, CardContent, Tab, Tabs, Box } from '@mui/material'
import AdvisorsMetric from './AdvisorsMetric'
import UserCommissionsMetric from './UserCommissionsMetric'

const CommissionsMetric = () => {
  const [tab, setTab] = useState(0)

  return (
    <Card sx={{ height: '100%' }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant='scrollable' scrollButtons='auto' sx={{ px: 2, pt: 1 }}>
        <Tab label='Top 10 Asesorías' />
        <Tab label='Top 10 Consultores' />
      </Tabs>

      <CardContent sx={{ height: '100%', overflow: 'auto' }}>
        {tab === 0 ? (
          <Box sx={{ height: 360 }}>
            <AdvisorsMetric />
          </Box>
        ) : (
          <Box sx={{ height: 360 }}>
            <UserCommissionsMetric />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default CommissionsMetric
