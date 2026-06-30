import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useTranslation } from 'react-i18next'

import { getDashboardLiveCourses } from 'src/api/api'

const CoursesTeacherMetric = () => {
  const { t } = useTranslation()
  const userData = useSelector((s: RootState) => (s as any).auth?.userData) as any

  const [series, setSeries] = useState<number[]>([])
  const [options, setOptions] = useState<ApexOptions>({})

  const title = useMemo(() => {
    return userData?.role === 'Docente' ? t('Courses comparison') : t('Created courses')
  }, [userData?.role, t])

  useEffect(() => {
    let cancelled = false

    const fetchCourses = async () => {
      try {
        const res = await getDashboardLiveCourses()
        const labels: string[] = res?.data?.data?.labels ?? []
        const data: number[] = res?.data?.data?.data ?? []

        if (cancelled) return

        setSeries(data)
        setOptions({
          labels,
          chart: { type: 'donut' },
          legend: { show: true, position: 'bottom' },
          dataLabels: { enabled: true },
          plotOptions: {
            pie: {
              donut: {
                size: '60%',
                labels: {
                  show: true,
                  total: {
                    show: true,
                    label: t('Total'),
                    formatter: w => String(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0))
                  }
                }
              }
            }
          },
          colors: ['#46b9b0', '#f8b786']
        })
      } catch (e) {
        console.error('Error obteniendo cursos:', e)
        setSeries([])
        setOptions({})
      }
    }

    fetchCourses()

    return () => {
      cancelled = true
    }
  }, [t])

  return (
    <Card>
      <CardHeader
        title={
          <Typography variant='h6' sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        }
      />
      <CardContent>
        <ReactApexChart type='donut' height={360} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default CoursesTeacherMetric
