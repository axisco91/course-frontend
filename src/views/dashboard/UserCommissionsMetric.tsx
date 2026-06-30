import { useEffect, useState } from 'react'
import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import { useTranslation } from 'react-i18next'

import { getDashboardUsersCommissionsTop } from 'src/api/api'

const UserCommissionsMetric = () => {
  const { t } = useTranslation()
  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<ApexOptions>({
    chart: { type: 'bar', redrawOnParentResize: true },
    plotOptions: { bar: { horizontal: false } },
    dataLabels: { enabled: false },
    xaxis: { categories: [], labels: { rotate: -45 } },
    yaxis: { title: { text: t('Commissions') } },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} €`
      }
    }
  })

  useEffect(() => {
    const run = async () => {
      try {
        const res = await getDashboardUsersCommissionsTop()
        const categories: string[] = res?.data?.data?.categories ?? []
        const data: number[] = res?.data?.data?.data ?? []

        setSeries([{ name: t('Total commissioned'), data }])
        setOptions(prev => ({
          ...prev,
          xaxis: { ...prev.xaxis, categories, labels: { rotate: -45 } }
        }))
      } catch (e) {
        console.error('Error getting users with commissions:', e)
      }
    }

    run()
  }, [t])

  return <ReactApexChart options={options} series={series} type='bar' height={320} />
}

export default UserCommissionsMetric
