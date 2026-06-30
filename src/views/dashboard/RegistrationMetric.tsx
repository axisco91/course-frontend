import { useEffect, useState } from 'react'
import { Card, CardContent } from '@mui/material'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'

import { getDashboardRegistrationsMetric } from 'src/api/api'

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
    xaxis: { categories: [] },
    yaxis: {
      decimalsInFloat: 0,
      labels: { formatter: v => `${v} €` }
    }
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await getDashboardRegistrationsMetric()
        const months: string[] = res?.data?.data?.months ?? []
        const yearlySeries = res?.data?.data?.yearly_series ?? []

        if (cancelled) return

        setSeries(yearlySeries)
        setOptions(prev => ({
          ...prev,
          colors: yearlySeries.map((_: unknown, index: number) => COLORS[index % COLORS.length]),
          xaxis: { ...prev.xaxis, categories: months }
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
      <CardContent>
        <ReactApexChart type='bar' height={350} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default RegistrationsMetric
