import { useEffect, useState } from 'react'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { getCourses } from 'src/api/api'

const LiveCourses = () => {
  const [loading, setLoading] = useState(true)
  const [series, setSeries] = useState<number[]>([])
  const [options, setOptions] = useState<ApexOptions>({})

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await getCourses()
        const courses = res?.data?.data?.courses ?? res?.data?.courses ?? res?.data?.data ?? res?.data ?? []
        const list = Array.isArray(courses) ? courses : []

        const currentYear = new Date().getFullYear()
        const lastYear = currentYear - 1

        const getYear = (c: any) => {
          if (!c?.beginning) return null
          const d = new Date(c.beginning)

          return isNaN(d.getTime()) ? null : d.getFullYear()
        }

        const current = list.filter(c => getYear(c) === currentYear).length
        const last = list.filter(c => getYear(c) === lastYear).length

        setSeries([current, last])

        setOptions({
          labels: [String(currentYear), String(lastYear)],
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
        // eslint-disable-next-line no-console
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
