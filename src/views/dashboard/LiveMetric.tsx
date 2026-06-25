import { useState } from 'react'
import { Card, CardContent, Tab, Tabs, Box } from '@mui/material'
import LiveTrainingContract from './LiveTrainingContract'
import LiveCourses from './Livecourses'

const LiveMetric = () => {
  const [tab, setTab] = useState(0)

  return (
    <Card sx={{ height: '100%' }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant='scrollable' scrollButtons='auto' sx={{ px: 2, pt: 1 }}>
        <Tab label='Contratos de formación vivos' />
        <Tab label='Cursos Bonificados vivos' />
      </Tabs>

      <CardContent sx={{ height: '100%', overflow: 'auto' }}>
        {tab === 0 ? (
          <Box sx={{ height: 360 }}>
            <LiveTrainingContract />
          </Box>
        ) : (
          <Box sx={{ height: 360 }}>
            <LiveCourses />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default LiveMetric
