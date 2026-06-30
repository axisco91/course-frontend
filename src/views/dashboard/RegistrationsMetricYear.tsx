import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'

import { getDashboardRegistrationsMetric } from 'src/api/api'

const RegistrationsMetricYear = () => {
  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<ApexOptions>({
    chart: {
      type: 'bar',
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    dataLabels: { enabled: false },
    xaxis: { categories: [] },
    yaxis: {
      decimalsInFloat: 0,
      labels: { formatter: v => `${v} €` }
    },
    colors: ['#f8b786']
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await getDashboardRegistrationsMetric()
        const totalsByYear: Array<{ year: string; total: number }> = res?.data?.data?.totals_by_year ?? []

        if (cancelled) return

        setSeries([{ name: 'Total Ventas (€)', data: totalsByYear.map(item => item.total) }])
        setOptions(prev => ({
          ...prev,
          xaxis: { ...prev.xaxis, categories: totalsByYear.map(item => item.year) }
        }))
      } catch (e) {
        console.error('Error obteniendo datos:', e)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card>
      <CardHeader
        title={
          <Typography variant='h6' sx={{ fontWeight: 700 }}>
            Registraciones por Año
          </Typography>
        }
      />
      <CardContent>
        <ReactApexChart type='bar' height={350} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default RegistrationsMetricYear
