import { useEffect, useState } from 'react'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { getDashboardLiveTrainingContracts } from 'src/api/api'

const LiveTrainingContract = () => {
  const [loading, setLoading] = useState(true)
  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<ApexOptions>({})

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await getDashboardLiveTrainingContracts()
        const categories: string[] = res?.data?.data?.categories ?? []
        const data: number[] = res?.data?.data?.data ?? []

        setSeries([{ name: 'CFA activos', data }])
        setOptions({
          chart: {
            type: 'area',
            zoom: { enabled: true, autoScaleYaxis: true },
            toolbar: { show: true }
          },
          stroke: { curve: 'smooth' },
          dataLabels: { enabled: false },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.7,
              opacityTo: 0.9,
              stops: [0, 90, 100]
            }
          },
          xaxis: {
            categories
          }
        })
      } catch (e) {
        console.error('Error fetching training contracts:', e)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  if (loading) return null

  return <ReactApexChart options={options} series={series} type='area' height={320} />
}

export default LiveTrainingContract
