import { useEffect, useMemo, useState } from 'react'
import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { getTrainingContracts } from 'src/api/api'

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

const LiveTrainingContract = () => {
  const [loading, setLoading] = useState(true)
  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<ApexOptions>({})

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await getTrainingContracts()
        const contracts = res?.data?.data?.training_contracts ?? res?.data?.training_contracts ?? res?.data ?? []
        const list = Array.isArray(contracts) ? contracts : []

        // rango de meses: últimos 12 meses (incluye el actual)
        const maxDate = monthStart(new Date())
        const minDate = monthStart(new Date())
        minDate.setMonth(maxDate.getMonth() - 11)

        // construir array de meses (timestamps) entre minDate y maxDate
        const months: Date[] = []
        const cur = new Date(minDate)
        while (cur <= maxDate) {
          months.push(new Date(cur))
          cur.setMonth(cur.getMonth() + 1)
        }

        const counts = Array(months.length).fill(0)

        list.forEach((c: any) => {
          const statusId = Number(c?.training_contract_status_id)
          if (statusId !== 2 && statusId !== 4) return

          const begin = c?.beginning ? new Date(c.beginning) : null
          if (!begin || isNaN(begin.getTime())) return

          let end = c?.end ? new Date(c.end) : null
          if (statusId === 4 && c?.on_leave_date) {
            const ol = new Date(c.on_leave_date)
            if (!isNaN(ol.getTime())) end = ol
          }
          if (!end || isNaN(end.getTime())) return

          // contar por mes si el contrato está activo en ese mes
          months.forEach((m, idx) => {
            const ms = monthStart(m)
            if (ms >= monthStart(begin) && ms <= monthStart(end)) counts[idx]++
          })
        })

        setSeries([{ name: 'CFA activos', data: counts }])

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
            type: 'datetime',
            min: minDate.getTime(),
            max: maxDate.getTime(),
            categories: months.map(m => m.getTime())
          }
        })
      } catch (e) {
        // eslint-disable-next-line no-console
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
