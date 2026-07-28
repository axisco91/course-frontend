import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import ReactApexChart from 'src/@core/components/react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useTranslation } from 'react-i18next'

import { getDashboardCoursesMetric } from 'src/api/api'

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

const CoursesMetric = () => {
  const { t } = useTranslation()
  const userData = useSelector((s: RootState) => s.auth.user)

  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<ApexOptions>({})

  const title = useMemo(() => {
    return userData?.role === 'Docente' ? t('Courses where I am the teacher') : t('Created courses')
  }, [userData?.role, t])

  useEffect(() => {
    let cancelled = false

    const fetchCourses = async () => {
      try {
        const res = await getDashboardCoursesMetric()
        const years: string[] = res?.data?.data?.years ?? []
        const backendSeries: Array<{ name: string; data: number[] }> = res?.data?.data?.series ?? []

        if (cancelled) return

        setSeries(backendSeries)
        setOptions({
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
          colors: backendSeries.map(item => getCourseColor(item.name)),
          grid: { strokeDashArray: 4 }
        })
      } catch (e) {
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
