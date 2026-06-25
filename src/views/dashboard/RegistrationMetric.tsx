// src/views/dashboard/RegistrationsMetric.tsx
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@mui/material'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'

import { getAllRegistrations } from 'src/api/api'

type Registration = {
  price?: number | string
  course?: { beginning?: string }
}

const MONTHS_ES = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString('es-ES', { month: 'long' })
)

const COLORS = ['#f8b786', '#46b9b0', '#c09cc9', '#FDD835', '#7E57C2']

const RegistrationsMetric = () => {
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
    xaxis: { categories: MONTHS_ES },
    yaxis: {
      decimalsInFloat: 0,
      labels: { formatter: v => `${v} €` }
    }
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

        // byYear[year][monthIndex] = total
        const byYear: Record<string, number[]> = {}

        for (const r of regs) {
          const beginning = r?.course?.beginning
          if (!beginning) continue
          const d = new Date(beginning)
          if (isNaN(d.getTime())) continue

          const year = String(d.getFullYear())
          const monthIdx = d.getMonth() // 0..11
          const price = Number(r?.price ?? 0) || 0

          if (!byYear[year]) byYear[year] = Array(12).fill(0)
          byYear[year][monthIdx] += price
        }

        const years = Object.keys(byYear).sort()

        const seriesData = years.map((year, i) => ({
          name: `Ventas en ${year} (€)`,
          data: byYear[year] ?? Array(12).fill(0)
        }))

        setSeries(seriesData)

        setOptions(prev => ({
          ...prev,
          colors: years.map((_, i) => COLORS[i % COLORS.length]),
          xaxis: { ...prev.xaxis, categories: MONTHS_ES }
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
      <CardContent>
        <ReactApexChart type='bar' height={350} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default RegistrationsMetric
