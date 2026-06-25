// src/views/dashboard/CoursesMetric.tsx
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
  courseType?: string // "Bonificado" | "CFA" | "Privado" | "Oferta" ...
}

const getCourseTypeLabel = (t: any) => String(t ?? 'Others')

const getCourseColor = (courseType: string) => {
  switch (courseType) {
    case 'Bonificado':
      return '#f8b786'
    case 'CFA':
      return '#46b9b0'
    case 'Privado':
      return '#c09cc9'
    case 'Oferta':
      return '#f0788f'
    default:
      return '#7367F0'
  }
}

const getYear = (date?: string) => {
  if (!date) return null
  const d = new Date(date)
  const y = d.getUTCFullYear()

  return Number.isFinite(y) ? String(y) : null
}

const CoursesMetric = () => {
  const { t } = useTranslation()
  const userData = useSelector((s: RootState) => (s as any).auth?.userData) as any

  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<ApexOptions>({})

  const title = useMemo(() => {
    return userData?.role === 'Docente' ? t('Courses where I am the teacher') : t('Created courses')
  }, [userData?.role, t])

  useEffect(() => {
    let cancelled = false

    const fetchCourses = async () => {
      try {
        const res = await getCourses()

        const courses: CourseRow[] = res?.data?.data?.courses ?? res?.data?.courses ?? res?.data ?? []

        if (cancelled) return

        const courseTypes = Array.from(new Set((courses ?? []).map(c => getCourseTypeLabel(c.courseType))))
        const years = Array.from(
          new Set((courses ?? []).map(c => getYear(c.beginning)).filter(Boolean) as string[])
        ).sort()

        const chartSeries = courseTypes.map(type => {
          const data = years.map(year => {
            const count = (courses ?? []).filter(c => {
              const y = getYear(c.beginning)

              return getCourseTypeLabel(c.courseType) === type && y === year
            }).length

            return count
          })

          return { name: type, data }
        })

        const chartOptions: ApexOptions = {
          chart: {
            type: 'bar',
            stacked: true,
            toolbar: { show: false },
            zoom: { enabled: false }
          },
          plotOptions: {
            bar: { horizontal: false, borderRadius: 6 }
          },
          dataLabels: { enabled: false },
          legend: { show: true, position: 'bottom' },
          xaxis: { categories: years },
          colors: courseTypes.map(t => getCourseColor(t)),
          grid: { strokeDashArray: 4 }
        }

        setSeries(chartSeries)
        setOptions(chartOptions)
      } catch (e) {
        // si quieres, aquí puedes usar tu handleError/logout como en el resto
        // eslint-disable-next-line no-console
        console.error('Error al obtener cursos:', e)
        setSeries([])
        setOptions({})
      }
    }

    fetchCourses()

    return () => {
      cancelled = true
    }
  }, [])

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
        <ReactApexChart type='bar' height={360} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default CoursesMetric
