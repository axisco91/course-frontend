import { useEffect, useState } from 'react'
import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import { useTranslation } from 'react-i18next'

import { getAdvisorsWithCommissions } from 'src/api/api'

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
        const res = await getAdvisorsWithCommissions()
        const advisors = res?.data?.data?.advisors ?? res?.data?.advisors ?? res?.data?.data ?? res?.data ?? []
        console.log(res?.data?.data?.advisors)

        const list = Array.isArray(advisors) ? advisors : []

        // total por asesor
        const top = list
          .map((a: any) => {
            const total = (a?.commissions ?? []).reduce((acc: number, c: any) => acc + Number(c?.amount ?? 0), 0)

            return { ...a, totalCommissions: Number(total.toFixed(2)) }
          })
          .sort((a: any, b: any) => b.totalCommissions - a.totalCommissions)
          .slice(0, 10)

        const categories = top.map((a: any) => a?.name ?? '')
        const data = top.map((a: any) => a.totalCommissions)

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
        // eslint-disable-next-line no-console
        console.error('Error getting advisors with commissions:', e)
      }
    }

    run()
  }, [t])

  return <ReactApexChart options={options} series={series} type='bar' height={320} />
}

export default AdvisorsMetric
