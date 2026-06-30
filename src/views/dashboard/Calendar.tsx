import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, Grid, TextField, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

import { getDashboardCalendarEvents } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import CalendarTracingDialog from './CalendarTracingDialog'
import CalendarChoresDialog from './CalendarChoresDialog'
import TracingsModal from 'src/views/tracings/TracingsModal'
import TrainingContractsModal from 'src/views/training-contracts/TrainingContractsModal'
import { tracingActions } from 'src/reducers/tracings/TracingReducer'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'

dayjs.locale('es')

const ymd = (d?: any) => {
  if (!d) return ''
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    return dayjs(d).format('YYYY-MM-DD')
  }

  const raw = String(d).trim()
  if (!raw) return ''

  const isoLike = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoLike) return `${isoLike[1]}-${isoLike[2]}-${isoLike[3]}`

  const dmySlash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmySlash) return `${dmySlash[3]}-${dmySlash[2]}-${dmySlash[1]}`

  const dmyDash = raw.match(/^(\d{2})-(\d{2})-(\d{4})/)
  if (dmyDash) return `${dmyDash[3]}-${dmyDash[2]}-${dmyDash[1]}`

  const parsed = dayjs(raw)
  if (parsed.isValid()) return parsed.format('YYYY-MM-DD')

  return ''
}

const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const getEventOrder = (event: any) => {
  const dateKind = String(event?.meta?.dateKind ?? '').toLowerCase()
  const title = String(event?.title ?? '').toLowerCase()

  if (dateKind === 'start' || title.includes('inicio curso') || title.endsWith(' - inicio') || title.includes(' - inicio contrato')) {
    return 0
  }

  if (dateKind === 'quarter' || title.includes('25%')) return 1
  if (dateKind === 'half' || title.includes('50%')) return 2
  if (dateKind === 'three_quarters' || title.includes('75%')) return 3

  if (dateKind === 'end' || title.includes('fin curso') || title.endsWith(' - fin') || title.includes(' - fin contrato')) {
    return 4
  }

  return 5
}

const compareCalendarEvents = (a: any, b: any) => {
  const orderDiff = getEventOrder(a) - getEventOrder(b)
  if (orderDiff !== 0) return orderDiff

  return String(a?.title ?? '').localeCompare(String(b?.title ?? ''), 'es', { sensitivity: 'base' })
}

const normalizeKeyPart = (value: any) => removeAccents(String(value ?? '').toLowerCase()).replace(/\s+/g, ' ').trim()

const getEventSourcePriority = (event: any) => {
  if (event?.type === 'tracing') return 0
  if (event?.type === 'mainContract') return 1
  if (event?.type === 'trainingContract') return 2

  return 3
}

const dedupeTracingViewEvents = (items: any[]) => {
  const bestByKey = new Map<string, any>()

  for (const event of items) {
    const raw = event?.meta?.raw
    const tracing = event?.meta?.tracing
    const key = [
      ymd(event?.start),
      getEventOrder(event),
      normalizeKeyPart(
        tracing
          ? `${tracing?.student_name ?? ''} ${tracing?.student_surname ?? ''}`
          : raw?.student != null
          ? `${raw.student.name ?? ''} ${raw.student.surname ?? ''}`
          : raw?.training_contract?.student != null
          ? `${raw.training_contract.student.name ?? ''} ${raw.training_contract.student.surname ?? ''}`
          : String(event?.title ?? '').split('-')[0]
      ),
      normalizeKeyPart(tracing?.course_name ?? raw?.course_name ?? ''),
      normalizeKeyPart(tracing?.company_name ?? raw?.company_name ?? '')
    ].join('|')

    const existing = bestByKey.get(key)
    if (!existing || getEventSourcePriority(event) < getEventSourcePriority(existing)) {
      bestByKey.set(key, event)
    }
  }

  return Array.from(bestByKey.values())
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

  const [loading, setLoading] = useState(false)
  const [displayData, setDisplayData] = useState<'tracings' | 'training_contract_elements'>('tracings')
  const [filter, setFilter] = useState('')

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [openTracing, setOpenTracing] = useState(false)
  const [openChores, setOpenChores] = useState(false)
  const [monthStart, setMonthStart] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [monthEnd, setMonthEnd] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))

  const [events, setEvents] = useState<any[]>([])
  const requestIdRef = useRef(0)
  const activeRangeRef = useRef<string | null>(null)
  const loadedRangeRef = useRef<string | null>(null)

  const fetchCalendarEvents = useCallback(async () => {
    const rangeKey = `${monthStart}:${monthEnd}`
    if (activeRangeRef.current === rangeKey) return
    if (loadedRangeRef.current === rangeKey) {
      setLoading(false)

      return
    }

    activeRangeRef.current = rangeKey
    const requestId = ++requestIdRef.current
    setLoading(true)
    try {
      const res = await getDashboardCalendarEvents({ from: monthStart, to: monthEnd })
      const tracingEvents = res?.data?.data?.tracing_events ?? []
      const trainingContractEvents = res?.data?.data?.training_contract_events ?? []
      const mainContractEvents = res?.data?.data?.main_contract_events ?? []

      if (requestId !== requestIdRef.current) return
      setEvents([...tracingEvents, ...trainingContractEvents, ...mainContractEvents])
      loadedRangeRef.current = rangeKey
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      handleErrorRef.current(e, logoutRef.current)
      setEvents([])
      loadedRangeRef.current = null
    } finally {
      if (activeRangeRef.current === rangeKey) {
        activeRangeRef.current = null
      }
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [monthStart, monthEnd])

  useEffect(() => {
    fetchCalendarEvents()
  }, [fetchCalendarEvents])

  const filteredEvents = useMemo(() => {
    const normalizedFilter = removeAccents(filter.toLowerCase())
    const byText = !normalizedFilter
      ? events
      : events.filter(ev => removeAccents(String(ev?.title ?? '').toLowerCase()).includes(normalizedFilter))

    const filtered = byText
      .filter(ev =>
        displayData === 'tracings'
          ? ev?.type === 'tracing' || ev?.type === 'mainContract' || ev?.type === 'trainingContract'
          : ev?.type === 'trainingContract' || ev?.type === 'mainContract'
      )

    return (displayData === 'tracings' ? dedupeTracingViewEvents(filtered) : filtered)
      .slice()
      .sort(compareCalendarEvents)
  }, [displayData, events, filter])

  const eventsByDay = useMemo(() => {
    return filteredEvents.reduce<Record<string, any[]>>((acc, event) => {
      const date = ymd(event?.start)
      if (!date) return acc
      if (!acc[date]) acc[date] = []
      acc[date].push(event)

      return acc
    }, {})
  }, [filteredEvents])

  const calendarCells = useMemo(() => {
    const start = dayjs(monthStart)
    const daysInMonth = start.daysInMonth()
    const offset = (start.day() + 6) % 7
    const cells: Array<{ key: string; date: string | null; dayNumber: number | null }> = []

    for (let i = 0; i < offset; i++) {
      cells.push({ key: `empty-${i}`, date: null, dayNumber: null })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = start.date(day).format('YYYY-MM-DD')
      cells.push({ key: date, date, dayNumber: day })
    }

    while (cells.length % 7 !== 0) {
      cells.push({ key: `tail-${cells.length}`, date: null, dayNumber: null })
    }

    return cells
  }, [monthStart])

  const navigateMonth = (delta: number) => {
    const next = dayjs(monthStart).add(delta, 'month')
    setMonthStart(next.startOf('month').format('YYYY-MM-DD'))
    setMonthEnd(next.endOf('month').format('YYYY-MM-DD'))
  }

  const goToday = () => {
    const now = dayjs()
    setMonthStart(now.startOf('month').format('YYYY-MM-DD'))
    setMonthEnd(now.endOf('month').format('YYYY-MM-DD'))
  }

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
    openDialogForDay(info?.dateStr)
  }

  const handleEventClick = (info: any) => {
    info?.jsEvent?.preventDefault?.()
    openDialogForDay(ymd(info?.event?.startStr ?? info?.event?.start))
  }

  const toggleMode = () => {
    setFilter('')
    setDisplayData(prev => (prev === 'tracings' ? 'training_contract_elements' : 'tracings'))
  }

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

      <Card sx={{ mb: 6 }}>
        <CardContent>
          {loading ? (
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Cargando calendario...
            </Typography>
          ) : null}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant='contained' color='secondary' onClick={() => navigateMonth(-1)}>
                <Icon icon='tabler:chevron-left' fontSize={18} />
              </Button>
              <Button variant='contained' color='secondary' onClick={goToday}>
                Hoy
              </Button>
            </Box>

            <Typography variant='h4' fontWeight={800} sx={{ textTransform: 'capitalize' }}>
              {dayjs(monthStart).format('MMMM [de] YYYY')}
            </Typography>

            <Button variant='contained' color='secondary' onClick={() => navigateMonth(1)}>
              <Icon icon='tabler:chevron-right' fontSize={18} />
            </Button>
          </Box>
          <Box
            sx={{
              maxHeight: 550,
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                borderTop: theme => `1px solid ${theme.palette.divider}`,
                borderLeft: theme => `1px solid ${theme.palette.divider}`
              }}
            >
            {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(day => (
              <Box
                key={day}
                sx={{
                  p: 2,
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRight: theme => `1px solid ${theme.palette.divider}`,
                  borderBottom: theme => `1px solid ${theme.palette.divider}`,
                  backgroundColor: 'action.hover',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}
              >
                {day}
              </Box>
            ))}

            {calendarCells.map(cell => {
              const dayEvents = cell.date ? eventsByDay[cell.date] ?? [] : []
              const isToday = cell.date === dayjs().format('YYYY-MM-DD')

              return (
                <Box
                  key={cell.key}
                  onClick={() => (cell.date ? handleDateClick({ dateStr: cell.date }) : undefined)}
                  sx={{
                    minHeight: 140,
                    p: 1.5,
                    borderRight: theme => `1px solid ${theme.palette.divider}`,
                    borderBottom: theme => `1px solid ${theme.palette.divider}`,
                    cursor: cell.date ? 'pointer' : 'default',
                    backgroundColor: cell.date ? 'background.paper' : 'action.hover'
                  }}
                >
                  {cell.dayNumber ? (
                    <Box>
                      <Typography
                        variant='body2'
                        sx={{
                          fontWeight: isToday ? 800 : 600,
                          color: isToday ? 'primary.main' : 'text.primary',
                          mb: 1
                        }}
                      >
                        {cell.dayNumber}
                      </Typography>

                      {dayEvents.map((event, index) => (
                        <Box
                          key={`${cell.key}-${index}`}
                          onClick={evt => {
                            evt.stopPropagation()
                            handleEventClick({ event: { start: cell.date }, jsEvent: evt })
                          }}
                          sx={{
                            mb: 0.75,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: 12,
                            lineHeight: 1.2,
                            color: event?.textColor ?? '#fff',
                            backgroundColor: event?.color ?? 'primary.main',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere'
                          }}
                        >
                          {event?.title}
                        </Box>
                      ))}
                    </Box>
                  ) : null}
                </Box>
              )
            })}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <CalendarTracingDialog open={openTracing} onClose={() => setOpenTracing(false)} selectedDate={selectedDay} events={events} tracings={[]} />

      <CalendarChoresDialog open={openChores} onClose={() => setOpenChores(false)} selectedDate={selectedDay} events={events} elements={[]} />

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
    </Fragment>
  )
}

export default Calendar
