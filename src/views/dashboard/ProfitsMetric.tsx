// src/views/dashboard/ProfitsMetric.tsx
import { useState } from 'react'
import { Card, CardContent, Tab, Tabs, Box } from '@mui/material'

import RegistrationsMetricYear from './RegistrationsMetricYear'
import RegistrationsMetric from './RegistrationMetric'

const ProfitsMetric = () => {
  const [tab, setTab] = useState(0)

  return (
    <Card>
      <Box sx={{ px: 2, pt: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label='Ventas por mes' />
          <Tab label='Ventas por años' />
        </Tabs>
      </Box>

      <CardContent sx={{ p: 0, overflow: 'auto' }}>
        {tab === 0 ? <RegistrationsMetric /> : <RegistrationsMetricYear />}
      </CardContent>
    </Card>
  )
}

export default ProfitsMetric
