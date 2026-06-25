// src/views/dashboard/CoursesTeacherMetric.tsx
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useTranslation } from 'react-i18next'

import { getCourses } from 'src/api/api'

type CourseRow = {
  beginning?: string
}

const getYear = (date?: string) => {
  if (!date) return null
  const d = new Date(date)
  const y = d.getUTCFullYear()

  return Number.isFinite(y) ? y : null
}

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
        const res = await getCourses()
        const courses: CourseRow[] = res?.data?.data?.courses ?? res?.data?.data ?? res?.data ?? []

        if (cancelled) return

        const currentYear = new Date().getFullYear()
        const lastYear = currentYear - 1

        const currentYearCourses = (courses ?? []).filter(c => getYear(c.beginning) === currentYear).length
        const lastYearCourses = (courses ?? []).filter(c => getYear(c.beginning) === lastYear).length

        setSeries([currentYearCourses, lastYearCourses])

        setOptions({
          labels: [`${currentYear}`, `${lastYear}`],
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

          // Colores como en tu antiguo
          colors: ['#46b9b0', '#f8b786']
        })
      } catch (e) {
        // eslint-disable-next-line no-console
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
