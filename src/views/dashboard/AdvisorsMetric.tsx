import { useEffect, useState } from 'react'
import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import { useTranslation } from 'react-i18next'

import { getDashboardAdvisorsCommissionsTop } from 'src/api/api'

const AdvisorsMetric = () => {
  const { t } = useTranslation()
  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<ApexOptions>({
    chart: { type: 'bar' },
    plotOptions: { bar: { horizontal: false } },
    dataLabels: { enabled: false },
    xaxis: { categories: [], labels: { rotate: -45 } },
    yaxis: { title: { text: t('Commissions') } }
  })

  useEffect(() => {
    const run = async () => {
      try {
        const res = await getDashboardAdvisorsCommissionsTop()
        const categories: string[] = res?.data?.data?.categories ?? []
        const data: number[] = res?.data?.data?.data ?? []

        setSeries([{ name: t('Total commissioned'), data }])
        setOptions(prev => ({
          ...prev,
          chart: { ...prev.chart, type: 'bar', redrawOnParentResize: true },
          xaxis: { ...prev.xaxis, categories, labels: { rotate: -45 } },
          tooltip: {
            y: {
              formatter: (val: number) => `${val} €`
            }
          }
        }))
      } catch (e) {
        console.error('Error getting advisors with commissions:', e)
      }
    }

    run()
  }, [t])

  return <ReactApexChart options={options} series={series} type='bar' height={320} />
}

export default AdvisorsMetric
