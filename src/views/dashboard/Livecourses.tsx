import { useEffect, useState } from 'react'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { getDashboardLiveCourses } from 'src/api/api'

const LiveCourses = () => {
  const [loading, setLoading] = useState(true)
  const [series, setSeries] = useState<number[]>([])
  const [options, setOptions] = useState<ApexOptions>({})

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await getDashboardLiveCourses()
        const labels: string[] = res?.data?.data?.labels ?? []
        const data: number[] = res?.data?.data?.data ?? []

        setSeries(data)
        setOptions({
          labels,
          chart: { type: 'donut' },
          legend: { show: true },
          dataLabels: { enabled: true },
          plotOptions: {
            pie: {
              donut: {
                size: '60%',
                labels: {
                  show: true,
                  total: {
                    show: true,
                    label: 'Total',
                    formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
                  }
                }
              }
            }
          }
        })
      } catch (e) {
        console.error('Error fetching courses:', e)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  if (loading) return null

  return <ReactApexChart options={options} series={series} type='donut' height={320} />
}

export default LiveCourses
