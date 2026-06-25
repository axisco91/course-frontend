import { useEffect, useState } from 'react'
import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import { useTranslation } from 'react-i18next'

import { getUsersWithCommissions } from 'src/api/api'

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
        const res = await getUsersWithCommissions()
        const users = res?.data?.data?.users ?? res?.data?.users ?? res?.data?.data ?? res?.data ?? []

        const list = Array.isArray(users) ? users : []

        const top = list
          .map((u: any) => {
            const total = (u?.commissions ?? []).reduce((acc: number, c: any) => acc + Number(c?.amount ?? 0), 0)

            return { ...u, totalCommissions: Number(total.toFixed(2)) }
          })
          .sort((a: any, b: any) => b.totalCommissions - a.totalCommissions)
          .slice(0, 10)

        const categories = top.map((u: any) => u?.name ?? '')
        const data = top.map((u: any) => u.totalCommissions)

        setSeries([{ name: t('Total commissioned'), data }])
        setOptions(prev => ({
          ...prev,
          xaxis: { ...prev.xaxis, categories, labels: { rotate: -45 } }
        }))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error getting users with commissions:', e)
      }
    }

    run()
  }, [t])

  return <ReactApexChart options={options} series={series} type='bar' height={320} />
}

export default UserCommissionsMetric
