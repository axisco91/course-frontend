import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, IconButton, List, ListItemButton, ListItemText, Menu, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { getDashboardCalendarEvents } from 'src/api/api'
import { useDispatch } from 'react-redux'
import { tracingActions } from 'src/reducers/tracings/TracingReducer'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'

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

const toDisplayDate = (value?: string) => {
  if (!value) return ''
  const strict = dayjs(value, 'YYYY-MM-DD', true)
  if (strict.isValid()) return strict.format('DD/MM/YYYY')

  const parsed = dayjs(value)
  if (parsed.isValid()) return parsed.format('DD/MM/YYYY')

  return ''
}

const normalizeKeyPart = (value: any) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const getEventOrder = (event: any) => {
  const dateKind = String(event?.meta?.dateKind ?? '').toLowerCase()
  const title = String(event?.title ?? '').toLowerCase()

  if (dateKind === 'start' || title.includes('inicio curso') || title.endsWith(' - inicio') || title.includes(' - inicio contrato')) return 0
  if (dateKind === 'quarter' || title.includes('25%')) return 1
  if (dateKind === 'half' || title.includes('50%')) return 2
  if (dateKind === 'three_quarters' || title.includes('75%')) return 3
  if (dateKind === 'end' || title.includes('fin curso') || title.endsWith(' - fin') || title.includes(' - fin contrato')) return 4

  return 5
}

const getEventSourcePriority = (event: any) => {
  if (event?.type === 'tracing') return 0
  if (event?.type === 'mainContract') return 1
  if (event?.type === 'trainingContract') return 2

  return 3
}

const isHiddenTracingViewEvent = (event: any) => {
  if (event?.type !== 'trainingContract') return false

  const eventKind = String(event?.meta?.raw?.event_kind ?? '').toLowerCase()
  const courseId = Number(event?.meta?.raw?.course_id ?? 0)

  if (eventKind === 'start') return true

  return eventKind === 'end' && (!Number.isFinite(courseId) || courseId <= 0)
}

const dedupeCalendarEvents = (items: any[]) => {
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

const TracingNotificationDropdown = () => {
  const dispatch = useDispatch()
  const router = useRouter()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [tracings, setTracings] = useState<any[]>([])
  const [hideBadge, setHideBadge] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const today = ymd(new Date())
        const res = await getDashboardCalendarEvents({ from: today, to: today })
        const data = res?.data?.data ?? {}
        if (active) {
          setTracings([
            ...(data.tracing_events ?? []),
            ...(data.training_contract_events ?? []),
            ...(data.main_contract_events ?? [])
          ])
        }
      } catch (e) {
        if (active) setTracings([])
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const today = ymd(new Date())
  const pendingToday = useMemo(() => {
    const eventsToday = (Array.isArray(tracings) ? tracings : [])
      .filter((notification: any) => ymd(notification?.start) === today)
      .filter((notification: any) => !isHiddenTracingViewEvent(notification))

    return dedupeCalendarEvents(eventsToday).sort((a, b) => {
      const order = getEventOrder(a) - getEventOrder(b)
      if (order !== 0) return order

      return String(a?.title ?? '').localeCompare(String(b?.title ?? ''), 'es', { sensitivity: 'base' })
    })
  }, [tracings, today])

  const open = Boolean(anchorEl)
  const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const handleReadAll = () => {
    setHideBadge(true)
    handleClose()
  }

  const handleOpenEvent = async (item: any) => {
    handleClose()
    if (router.pathname !== '/home') {
      await router.push('/home')
    }

    if (item?.type === 'tracing') {
      const tracingId = Number(item?.meta?.tracingId)
      if (!Number.isFinite(tracingId) || tracingId <= 0) return
      dispatch(tracingActions.setId(tracingId))
      dispatch(tracingActions.openModal({ mode: 'view', courseId: tracingId }))

      return
    }

    const trainingContractId = Number(item?.meta?.training_contract_id)
    if (!Number.isFinite(trainingContractId) || trainingContractId <= 0) return
    dispatch(trainingContractActions.setId(trainingContractId))
    dispatch(trainingContractActions.openModal({ mode: 'view' }))
  }

  return (
    <>
      <IconButton color='inherit' aria-haspopup='true' onClick={handleOpen}>
        <Badge
          color='error'
          variant='dot'
          invisible={hideBadge || pendingToday.length === 0}
          sx={{ '& .MuiBadge-badge': { top: 4, right: 4 } }}
        >
          <Icon fontSize='1.625rem' icon='tabler:bell' />
        </Badge>
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <Box sx={{ width: 360, maxWidth: '100%' }}>
          <Box sx={{ px: 4, py: 3, borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
            <Typography variant='h6'>Notificaciones</Typography>
            <Typography variant='body2' color='text.secondary'>
              {pendingToday.length} nuevas
            </Typography>
          </Box>

          <List sx={{ maxHeight: 320, overflowY: 'auto', py: 0 }}>
            {pendingToday.length === 0 ? (
              <Box sx={{ px: 4, py: 3 }}>
                <Typography variant='body2' color='text.secondary'>
                  No hay notificaciones pendientes para hoy.
                </Typography>
              </Box>
            ) : (
              pendingToday.map((item, index) => (
                <ListItemButton
                  key={`${item.type}-${item?.meta?.tracingId ?? item?.meta?.training_contract_id ?? index}-${index}`}
                  onClick={() => handleOpenEvent(item)}
                >
                  <ListItemText
                    primary={item.title}
                    secondary={toDisplayDate(ymd(item.start))}
                  />
                </ListItemButton>
              ))
            )}
          </List>

          <Box sx={{ p: 3, borderTop: theme => `1px solid ${theme.palette.divider}` }}>
            <Button fullWidth variant='contained' onClick={handleReadAll}>
              {pendingToday.length > 0 ? 'Marcar notificaciones como leídas' : 'Cerrar notificaciones'}
            </Button>
          </Box>
        </Box>
      </Menu>
    </>
  )
}

export default TracingNotificationDropdown
