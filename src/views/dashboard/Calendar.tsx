import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, Grid, TextField, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import LoadingDialog from 'src/views/components/LoadingDialog'
import dayjs from 'dayjs'

import dynamic from 'next/dynamic'

// ✅ FullCalendar plugins
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

// ✅ API (ajusta exports si cambian)
import { getAllTrainingContractElements, getTracings, getTrainingContracts } from 'src/api/api'

// ✅ auth/error
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ✅ dialogs
import CalendarTracingDialog from './CalendarTracingDialog'
import CalendarChoresDialog from './CalendarChoresDialog'
import TracingsModal from 'src/views/tracings/TracingsModal'
import TrainingContractsModal from 'src/views/training-contracts/TrainingContractsModal'
import { tracingActions } from 'src/reducers/tracings/TracingReducer'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'

// ✅ FullCalendar SSR-safe
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false })

type CalendarEvent = {
  id?: string | number
  title: string
  start: string // YYYY-MM-DD
  color?: string
  textColor?: string
  type: 'tracing' | 'trainingContract' | 'mainContract'
  meta?: any
}

const ymd = (d?: any) => {
  if (!d) return ''
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    return dayjs(d).format('YYYY-MM-DD')
  }

  const raw = String(d).trim()
  if (!raw) return ''

  // YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...
  const isoLike = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoLike) return `${isoLike[1]}-${isoLike[2]}-${isoLike[3]}`

  // DD/MM/YYYY
  const dmySlash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmySlash) return `${dmySlash[3]}-${dmySlash[2]}-${dmySlash[1]}`

  // DD-MM-YYYY
  const dmyDash = raw.match(/^(\d{2})-(\d{2})-(\d{4})/)
  if (dmyDash) return `${dmyDash[3]}-${dmyDash[2]}-${dmyDash[1]}`

  const parsed = dayjs(raw)
  if (parsed.isValid()) return parsed.format('YYYY-MM-DD')

  return ''
}

const firstValidYmd = (...values: any[]) => {
  for (const v of values) {
    if (v === null || v === undefined) continue
    const s = String(v).trim()
    if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') continue
    const normalized = ymd(s)
    if (normalized) return normalized
  }

  return ''
}

const getTracingDateByKey = (t: any, key: 'welcome' | 'quarter' | 'half' | 'three_quarters' | 'final') =>
  firstValidYmd(
    t?.[`${key}_date`],
    t?.[`${key}_date_base`],
    t?.course?.[`${key}_date`],
    t?.course?.[`${key}_date_base`],
    t?.[`${key}_date_sent`],
    t?.course?.[`${key}_date_sent`],
    key === 'welcome' ? t?.follow_up_date : undefined,
    t?.[key]
  )

const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const resolveCourseType = (t: any) => {
  const direct = String(
    t?.course_type ??
      t?.course_type_name ??
      t?.course?.course_type?.name ??
      t?.course?.type?.name ??
      t?.courseType ??
      ''
  ).trim()
  if (direct) return direct

  const typeId = Number(t?.course_type_id ?? t?.course?.course_type_id ?? 0)
  switch (typeId) {
    case 1:
      return 'Bonificado'
    case 2:
      return 'Privado'
    case 3:
      return 'Oferta'
    case 4:
      return 'CFA'
    default:
      return ''
  }
}
const pickArray = (...candidates: any[]) => {
  for (const c of candidates) {
    if (Array.isArray(c)) return c
    if (Array.isArray(c?.data)) return c.data
    if (Array.isArray(c?.rows)) return c.rows
  }

  return []
}

const pickMeta = (res: any) => res?.data?.data?.meta ?? res?.data?.meta ?? null

const pickPagination = (res: any) => res?.data?.data?.pagination ?? res?.data?.pagination ?? null

const isDateInMonthRange = (date: string, monthStart: string, monthEnd: string) => {
  if (!date) return false
  const d = dayjs(date, 'YYYY-MM-DD', true)
  const s = dayjs(monthStart, 'YYYY-MM-DD', true)
  const e = dayjs(monthEnd, 'YYYY-MM-DD', true)
  if (!d.isValid() || !s.isValid() || !e.isValid()) return false

  const dv = d.startOf('day').valueOf()
  const sv = s.startOf('day').valueOf()
  const ev = e.endOf('day').valueOf()

  return dv >= sv && dv <= ev
}

const isPastCalendarDay = (date: string) => {
  if (!date) return false
  const d = dayjs(date, 'YYYY-MM-DD', true)
  if (!d.isValid()) return false

  return d.endOf('day').valueOf() < dayjs().startOf('day').valueOf()
}

const hasRegisteredCourse = (element: any) =>
  element?.course_id != null || element?.course?.id != null || element?.courseId != null

const getTaskEventVisual = (element: any, date: string) => {
  if (hasRegisteredCourse(element)) {
    return {
      color: '#c5e4e4',
      textColor: '#1f2937'
    }
  }

  const done = isPastCalendarDay(date)

  return {
    color: done ? '#c5e4e4' : '#46b9b0',
    textColor: done ? '#1f2937' : '#ffffff'
  }
}

const getTrainingElementStart = (element: any) =>
  ymd(
    element?.course?.beginning ??
      element?.course?.start_date ??
      element?.course?.start ??
      element?.course_beginning ??
      element?.course_start ??
      element?.start_date ??
      element?.beginning_formation ??
      element?.beginning ??
      element?.start
  )

const getTrainingElementEnd = (element: any) =>
  ymd(
    element?.course?.end ??
      element?.course?.end_date ??
      element?.course?.ending ??
      element?.course?.finish ??
      element?.course_end ??
      element?.end_date ??
      element?.end_formation ??
      element?.end ??
      element?.ending ??
      element?.finish
  )

const resolveCourseForElement = (element: any, courses: any[]) => {
  const courseId = Number(element?.course_id ?? element?.course?.id ?? element?.courseId ?? 0)
  if (!Number.isFinite(courseId) || courseId <= 0) return element?.course ?? null

  return (
    element?.course ??
    (Array.isArray(courses) ? courses.find((course: any) => Number(course?.id) === courseId) ?? null : null)
  )
}

const Calendar = () => {
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const userData = useSelector((s: RootState) => (s as any).auth?.userData) as any
  const tracingModalOpen = useSelector((s: RootState) => (s as any).tracing?.modalOpen)
  const tracingModalMode = useSelector((s: RootState) => (s as any).tracing?.modalMode)
  const tracingId = useSelector((s: RootState) => (s as any).tracing?.id)
  const trainingContractModalOpen = useSelector((s: RootState) => (s as any).trainingContract?.modalOpen)
  const trainingContractModalMode = useSelector((s: RootState) => (s as any).trainingContract?.modalMode)
  const trainingContractId = useSelector((s: RootState) => (s as any).trainingContract?.id)
  const coursesRaw = useSelector((s: RootState) => (s as any).course?.courses) as any[]

  const [loading, setLoading] = useState(false)
  const [displayData, setDisplayData] = useState<'tracings' | 'training_contract_elements'>('tracings')
  const [filter, setFilter] = useState('')

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [openTracing, setOpenTracing] = useState(false)
  const [openChores, setOpenChores] = useState(false)
  const [monthStart, setMonthStart] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [monthEnd, setMonthEnd] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))

  const [tracings, setTracings] = useState<any[]>([])
  const [trainingElements, setTrainingElements] = useState<any[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const calendarRef = useRef<any>(null)

  // 🎨 lógica antigua: color "claro" si cualquier hito del tracing ya fue enviado
  const getCourseTypeColor = (
    courseType: string,
    final_message = 0,
    welcome_message = 0,
    quarter_message = 0,
    half_message = 0,
    three_quarters_message = 0
  ) => {
    if (
      final_message === 1 ||
      welcome_message === 1 ||
      quarter_message === 1 ||
      half_message === 1 ||
      three_quarters_message === 1
    ) {
      switch (courseType) {
        case 'Bonificado':
          return '#fde9db'
        case 'CFA':
          return '#c5e4e4'
        case 'Privado':
          return '#ece1ee'
        case 'Oferta':
          return '#eeeeee'
        default:
          return '#eeeeee'
      }
    }

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

  const buildTracingEvents = useCallback((list: any[]): CalendarEvent[] => {
    const filtered = (Array.isArray(list) ? list : []).filter(
      (t: any) => Number(t?.course_status_id ?? t?.course?.course_status_id) !== 4
    )

    return filtered.flatMap((t: any) => {
      const courseType = resolveCourseType(t)
      const welcomeDate = getTracingDateByKey(t, 'welcome')
      const quarterDate = getTracingDateByKey(t, 'quarter')
      const halfDate = getTracingDateByKey(t, 'half')
      const threeQuartersDate = getTracingDateByKey(t, 'three_quarters')
      const finalDate = getTracingDateByKey(t, 'final')
      const studentLabel = `${t?.student_name ?? t?.student?.name ?? ''}`.trim()

      const evs: CalendarEvent[] = [
        {
          title: `${studentLabel} - Fecha de Bienvenida`,
          start: welcomeDate,

          // Igual que el código antiguo: color por hito (solo pasa 1 flag)
          color: getCourseTypeColor(courseType, Number(t?.welcome_message ?? 0)),
          type: 'tracing',
          meta: { tracingId: t.id ?? t.value, tracing: t, dateKind: 'welcome' }
        },
        {
          title: `${studentLabel} - Fecha Fin`,
          start: finalDate,
          color: getCourseTypeColor(courseType, Number(t?.final_message ?? 0)),
          type: 'tracing',
          meta: { tracingId: t.id ?? t.value, tracing: t, dateKind: 'final' }
        }
      ]

      // 25%
      if (welcomeDate !== quarterDate && quarterDate !== halfDate && quarterDate !== threeQuartersDate) {
        evs.splice(1, 0, {
          title: `${studentLabel} - 25%`,
          start: quarterDate,
          color: getCourseTypeColor(courseType, Number(t?.quarter_message ?? 0)),
          type: 'tracing',
          meta: { tracingId: t.id ?? t.value, tracing: t, dateKind: 'quarter' }
        })
      }

      // 50%
      if (halfDate && halfDate !== threeQuartersDate) {
        evs.splice(2, 0, {
          title: `${studentLabel} - 50%`,
          start: halfDate,
          color: getCourseTypeColor(courseType, Number(t?.half_message ?? 0)),
          type: 'tracing',
          meta: { tracingId: t.id ?? t.value, tracing: t, dateKind: 'half' }
        })
      }

      // 75%
      if (threeQuartersDate && threeQuartersDate !== finalDate) {
        evs.splice(3, 0, {
          title: `${studentLabel} - 75%`,
          start: threeQuartersDate,
          color: getCourseTypeColor(courseType, Number(t?.three_quarters_message ?? 0)),
          type: 'tracing',
          meta: { tracingId: t.id ?? t.value, tracing: t, dateKind: 'three_quarters' }
        })
      }

      const validEvents = evs.filter(e => Boolean(e.start))
      if (validEvents.length > 0) return validEvents

      const fallbackStart = firstValidYmd(t?.follow_up_date, t?.course?.beginning, t?.created_at)
      if (!fallbackStart) return []

      return [
        {
          title: `${studentLabel} - Seguimiento`,
          start: fallbackStart,
          color: getCourseTypeColor(
            courseType,
            Number(t?.final_message ?? 0),
            Number(t?.welcome_message ?? 0),
            Number(t?.quarter_message ?? 0),
            Number(t?.half_message ?? 0),
            Number(t?.three_quarters_message ?? 0)
          ),
          type: 'tracing',
          meta: { tracingId: t.id ?? t.value, tracing: t, dateKind: 'fallback' }
        }
      ]
    })
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const fetchAllPages = async (
        fn: (params: any) => Promise<any>,
        baseParams: any,
        extractor: (res: any) => any[]
      ) => {
        const first = await fn({ ...baseParams, page: 1, perPage: 500, per_page: 500 })
        const firstRows = pickArray(extractor(first))
        const meta = pickMeta(first) ?? pickPagination(first)
        const current = Number(meta?.current_page ?? meta?.currentPage ?? meta?.page ?? 1)
        const last = Number(
          meta?.last_page ??
            meta?.lastPage ??
            meta?.total_pages ??
            meta?.totalPages ??
            meta?.pages ??
            meta?.pageCount ??
            1
        )
        if (!meta || !Number.isFinite(last) || last <= 1 || current >= last) return firstRows

        const all = [...firstRows]
        for (let p = current + 1; p <= last; p += 1) {
          const next = await fn({ ...baseParams, page: p, perPage: 500, per_page: 500 })
          const rows = pickArray(extractor(next))
          if (rows.length > 0) all.push(...rows)
        }

        return all
      }

      // ✅ 1) Tracings
      // Nota: /tracings filtra por courses.beginning/end, no por fechas de seguimiento.
      // Para no perder eventos del mes visible, cargamos sin rango y filtramos en frontend.
      const safeTr = await fetchAllPages(getTracings, {}, r =>
        pickArray(
          r?.data?.data?.tracings,
          r?.data?.tracings,
          r?.data?.data?.data,
          r?.data?.data,
          r?.data,
          r?.data?.data?.items,
          r?.data?.items
        )
      )

      setTracings(safeTr)

      const tracingEvents = buildTracingEvents(safeTr).filter(ev => isDateInMonthRange(ev.start, monthStart, monthEnd))

      const calendarTracingEvents: CalendarEvent[] = []

      // ✅ 2) Training contract elements (tareas)
      let elements = await fetchAllPages(
        getAllTrainingContractElements,
        { beginning: monthStart, end: monthEnd },
        r =>
          pickArray(
            r?.data?.data?.training_contract_elements,
            r?.data?.elements,
            r?.data?.data?.elements,
            r?.data?.data?.data,
            r?.data?.data,
            r?.data
          )
      )

      // Si backend ya devuelve "activos", no filtramos aquí por estado para no perder tareas válidas.
      elements = Array.isArray(elements) ? elements : []

      const normalizedElements = elements.map((element: any) => ({
        ...element,
        course: resolveCourseForElement(element, coursesRaw)
      }))
      setTrainingElements(normalizedElements)

      const elementEvents: CalendarEvent[] = normalizedElements
        .flatMap((el: any) => {
          const studentName = el?.student?.name
            ? `${String(el.student.name)} ${String(el?.student?.surname ?? '')}`.trim()
            : el?.training_contract?.student?.name
            ? `${String(el.training_contract.student.name)} ${String(
                el?.training_contract?.student?.surname ?? ''
              )}`.trim()
            : el?.student_name
            ? String(el.student_name)
            : 'Desconocido'

          const start = getTrainingElementStart(el)
          const end = getTrainingElementEnd(el)
          const trainingContractId = el?.training_contract_id ?? el?.training_contract?.id ?? el?.id

          return [
            start
              ? (() => {
                  const visual = getTaskEventVisual(el, start)

                  return {
                    title: `${studentName} - Inicio`,
                    start,
                    type: 'trainingContract',
                    color: visual.color,
                    textColor: visual.textColor,
                    meta: { elementId: el.id, training_contract_id: trainingContractId, raw: el }
                  }
                })()
              : null,
            end
              ? (() => {
                  const visual = getTaskEventVisual(el, end)

                  return {
                    title: `${studentName} - Fin`,
                    start: end,
                    type: 'trainingContract',
                    color: visual.color,
                    textColor: visual.textColor,
                    meta: { elementId: el.id, training_contract_id: trainingContractId, raw: el }
                  }
                })()
              : null
          ].filter(Boolean) as CalendarEvent[]
        })
        .filter(ev => isDateInMonthRange(ev.start, monthStart, monthEnd))

      // ✅ 3) Contratos principales (inicio/fin formación)
      const safeContracts = await fetchAllPages(getTrainingContracts, { not_canceled: 'true' }, r =>
        pickArray(
          r?.data?.data?.training_contracts,
          r?.data?.training_contracts,
          r?.data?.data?.contracts,
          r?.data?.contracts,
          r?.data?.data?.data,
          r?.data?.data,
          r?.data
        )
      )

      const contractEvents: CalendarEvent[] = safeContracts
        .filter((c: any) => Boolean(c?.beginning_formation || c?.beginning || c?.end_formation || c?.end))
        .flatMap((c: any) => {
          const student =
            `${c.student_name ?? c?.student?.name ?? ''} ${c.student_surname ?? c?.student?.surname ?? ''}`.trim() ||
            'Estudiante'
          const company = String(c.company_name ?? '').trim()

          const start = ymd(c.beginning_formation || c.beginning)
          const end = ymd(c.end_formation || c.end)

          const baseTitle = company ? `(${company})` : ''

          const evs: CalendarEvent[] = []
          if (start) {
            const visual = getTaskEventVisual('start', start)
            evs.push({
              title: `${student} - Inicio contrato ${baseTitle}`.trim(),
              start,
              type: 'mainContract',
              color: visual.color,
              textColor: visual.textColor,
              meta: { training_contract_id: c.id }
            })
          }
          if (end) {
            const visual = getTaskEventVisual('end', end)
            evs.push({
              title: `${student} - Fin contrato ${baseTitle}`.trim(),
              start: end,
              type: 'mainContract',
              color: visual.color,
              textColor: visual.textColor,
              meta: { training_contract_id: c.id }
            })
          }

          return evs
        })
        .filter(ev => isDateInMonthRange(ev.start, monthStart, monthEnd))

      const trainingContractMainEvents: CalendarEvent[] = safeContracts
        .filter((c: any) => Boolean(c?.beginning_formation || c?.beginning || c?.end_formation || c?.end))
        .flatMap((c: any) => {
          const student =
            `${c.student_name ?? c?.student?.name ?? ''} ${c.student_surname ?? c?.student?.surname ?? ''}`.trim() ||
            'Estudiante'
          const start = ymd(c.beginning_formation || c.beginning)
          const end = ymd(c.end_formation || c.end)

          const evs: CalendarEvent[] = []
          if (start) {
            const visual = getTaskEventVisual(c, start)
            evs.push({
              title: `${student} - Inicio`,
              start,
              type: 'trainingContract',
              color: visual.color,
              textColor: visual.textColor,
              meta: { training_contract_id: c.id, raw: c, source: 'trainingContractMain' }
            })
          }
          if (end) {
            const visual = getTaskEventVisual(c, end)
            evs.push({
              title: `${student} - Fin`,
              start: end,
              type: 'trainingContract',
              color: visual.color,
              textColor: visual.textColor,
              meta: { training_contract_id: c.id, raw: c, source: 'trainingContractMain' }
            })
          }

          return evs
        })
        .filter(ev => isDateInMonthRange(ev.start, monthStart, monthEnd))

      // ✅ merge final como en la versión antigua: sin deduplicado agresivo
      setEvents([
        ...tracingEvents,
        ...calendarTracingEvents,
        ...elementEvents,
        ...trainingContractMainEvents,
        ...contractEvents
      ])
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [buildTracingEvents, monthStart, monthEnd, coursesRaw])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleDatesSet = (arg: any) => {
    const pivot = dayjs(arg?.view?.calendar?.getDate?.() ?? arg?.start ?? new Date())
    const start = pivot.startOf('month').format('YYYY-MM-DD')
    const end = pivot.endOf('month').format('YYYY-MM-DD')

    if (start !== monthStart || end !== monthEnd) {
      setMonthStart(start)
      setMonthEnd(end)
    }
  }

  const filteredEvents = useMemo(() => {
    const f = removeAccents(filter.toLowerCase())
    const base = Array.isArray(events) ? events : []

    const byText = !f ? base : base.filter(ev => removeAccents(String(ev.title ?? '').toLowerCase()).includes(f))

    return byText.filter(ev =>
      displayData === 'tracings'
        ? ev.type === 'tracing' || ev.type === 'mainContract'
        : ev.type === 'trainingContract' || (ev as any).type === 'trainingContractMain'
    )
  }, [events, filter, displayData])

  const openDialogForDay = (clicked: string) => {
    if (!clicked) return
    setSelectedDay(clicked)

    if (displayData === 'tracings') {
      setOpenChores(false)
      setOpenTracing(true)

      return
    }

    setOpenTracing(false)
    setOpenChores(true)
  }

  const handleDateClick = (info: any) => {
    const clicked = info?.dateStr // YYYY-MM-DD
    openDialogForDay(clicked)
  }

  const handleEventClick = (info: any) => {
    info?.jsEvent?.preventDefault?.()
    const clicked = ymd(info?.event?.startStr ?? info?.event?.start)
    openDialogForDay(clicked)
  }

  const toggleMode = () => {
    setFilter('')
    setDisplayData(prev => (prev === 'tracings' ? 'training_contract_elements' : 'tracings'))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateCalendarSize = () => calendarRef.current?.getApi?.()?.updateSize?.()
    const t1 = window.setTimeout(updateCalendarSize, 0)
    const t2 = window.setTimeout(updateCalendarSize, 250)

    window.addEventListener('resize', updateCalendarSize)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', updateCalendarSize)
    }
  }, [displayData, filteredEvents.length, loading])

  return (
    <Fragment>
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Grid container spacing={4} alignItems='center'>
            <Grid item xs={12} md={8}>
              <Typography variant='h5' fontWeight={800}>
                {displayData === 'tracings' ? 'Calendario de seguimientos' : 'Calendario de tareas'}
              </Typography>
            </Grid>

            {userData?.role !== 'Docente' ? (
              <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button variant='contained' color='warning' onClick={toggleMode}>
                  <Icon icon='tabler:switch-2' fontSize={18} />
                  {displayData === 'tracings' ? 'Mostrar Tareas' : 'Mostrar Seguimientos'}
                </Button>
              </Grid>
            ) : null}

            <Grid item xs={12} md={4}>
              <TextField fullWidth label='Filtrar eventos' value={filter} onChange={e => setFilter(e.target.value)} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box
            sx={{
              '.fc': {
                width: '100%'
              },
              '.fc .fc-scrollgrid, .fc .fc-scrollgrid table, .fc .fc-col-header, .fc .fc-daygrid-body, .fc .fc-scrollgrid-sync-table':
                {
                  width: '100% !important'
                },
              '.fc .fc-event.fc-event-past, .fc .fc-daygrid-event.fc-event-past': {
                opacity: '1 !important'
              }
            }}
          >
            <FullCalendar
              ref={calendarRef}
              key={displayData}
              plugins={[dayGridPlugin as any, interactionPlugin as any]}
              initialView='dayGridMonth'
              initialDate={monthStart}
              firstDay={1}
              showNonCurrentDates={false}
              fixedWeekCount={false}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              events={filteredEvents as any}
              locale='es'
              dayMaxEvents
              headerToolbar={{ start: 'prev today', center: 'title', end: 'next' }}
              buttonText={{ today: 'Hoy' }}
              moreLinkText={(num: number) => `+${num}`}
            />
          </Box>
        </CardContent>
      </Card>

      <CalendarTracingDialog
        open={openTracing}
        onClose={() => setOpenTracing(false)}
        selectedDate={selectedDay}
        events={events}
        tracings={tracings}
      />

      <CalendarChoresDialog
        open={openChores}
        onClose={() => setOpenChores(false)}
        selectedDate={selectedDay}
        events={events}
        elements={trainingElements}
      />

      <TracingsModal
        open={Boolean(tracingModalOpen)}
        mode={(tracingModalMode ?? 'view') as any}
        tracingId={tracingId ?? null}
        onClose={() => dispatch(tracingActions.closeTracingModal())}
      />

      <TrainingContractsModal
        open={Boolean(trainingContractModalOpen)}
        mode={(trainingContractModalMode ?? 'view') as any}
        trainingContractId={trainingContractId ?? null}
        onClose={() => dispatch(trainingContractActions.closeTrainingContractModal())}
      />

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default Calendar
