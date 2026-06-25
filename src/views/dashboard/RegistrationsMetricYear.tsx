// src/views/dashboard/RegistrationsMetricYear.tsx
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'

import { getAllRegistrations } from 'src/api/api'

type Registration = {
  price?: number | string
  course?: { beginning?: string }
}

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
        const res = await getAllRegistrations()
        const regs: Registration[] =
          res?.data?.data?.registrations ?? res?.data?.registrations ?? res?.data?.data ?? res?.data ?? []

        if (cancelled) return
        if (!Array.isArray(regs)) {
          // eslint-disable-next-line no-console
          console.error('API response is not valid:', res?.data)

          return
        }

        // aggregate by year
        const byYear: Record<string, number> = {}
        for (const r of regs) {
          const beginning = r?.course?.beginning
          if (!beginning) continue
          const d = new Date(beginning)
          if (isNaN(d.getTime())) continue
          const year = String(d.getFullYear())
          const price = Number(r?.price ?? 0) || 0
          byYear[year] = (byYear[year] || 0) + price
        }

        const years = Object.keys(byYear).sort()
        const data = years.map(y => byYear[y] ?? 0)

        setSeries([{ name: 'Total Ventas (€)', data }])

        setOptions(prev => ({
          ...prev,
          xaxis: { ...prev.xaxis, categories: years },
          colors: ['#f8b786']
        }))
      } catch (e) {
        // eslint-disable-next-line no-console
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
