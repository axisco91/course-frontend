import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, IconButton, List, ListItemButton, ListItemText, Menu, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { getTracings } from 'src/api/api'
import { useDispatch } from 'react-redux'
import { tracingActions } from 'src/reducers/tracings/TracingReducer'
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

const pickArray = (...candidates: any[]) => {
  for (const c of candidates) {
    if (Array.isArray(c)) return c
    if (Array.isArray(c?.data)) return c.data
    if (Array.isArray(c?.rows)) return c.rows
  }

  return []
}

const getDateByKey = (t: any, key: 'welcome' | 'quarter' | 'half' | 'three_quarters' | 'final') =>
  ymd(
    t?.[`${key}_date`] ??
      t?.[`${key}_date_sent`] ??
      t?.course?.[`${key}_date`] ??
      t?.course?.[`${key}_date_sent`] ??
      (key === 'welcome' ? t?.follow_up_date : undefined)
  )

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
        const res = await getTracings({})
        const rows = pickArray(
          res?.data?.data?.tracings,
          res?.data?.tracings,
          res?.data?.data?.data,
          res?.data?.data,
          res?.data
        )
        if (active) setTracings(rows)
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
    const source = Array.isArray(tracings) ? tracings : []

    return source
      .filter((t: any) => Number(t?.course_status_id ?? t?.course?.course_status_id) !== 4)
      .flatMap((t: any) => {
        const dates = [
          { label: 'Fecha Fin', value: getDateByKey(t, 'final'), check: Number(t?.final_message ?? 0) },
          { label: '75%', value: getDateByKey(t, 'three_quarters'), check: Number(t?.three_quarters_message ?? 0) },
          { label: '50%', value: getDateByKey(t, 'half'), check: Number(t?.half_message ?? 0) },
          { label: 'Fecha Bienvenida', value: getDateByKey(t, 'welcome'), check: Number(t?.welcome_message ?? 0) },
          { label: '25%', value: getDateByKey(t, 'quarter'), check: Number(t?.quarter_message ?? 0) }
        ]

        return dates
          .filter(d => d.value === today && d.check === 0)
          .map(d => ({
            id: Number(t?.id ?? 0),
            title: `${t?.student_name ?? t?.student?.name ?? ''} ${t?.student_surname ?? t?.student?.surname ?? ''}`.trim(),
            subtitle: d.label,
            date: d.value
          }))
      })
      .filter(n => Number.isFinite(n.id) && n.id > 0)
  }, [tracings, today])

  const open = Boolean(anchorEl)
  const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const handleReadAll = () => {
    setHideBadge(true)
    handleClose()
  }

  const handleOpenTracing = async (id: number) => {
    handleClose()
    if (router.pathname !== '/home') {
      await router.push('/home')
    }
    dispatch(tracingActions.setId(id))
    dispatch(tracingActions.openModal({ mode: 'view', courseId: id }))
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
                <ListItemButton key={`${item.id}-${index}`} onClick={() => handleOpenTracing(item.id)}>
                  <ListItemText
                    primary={item.title}
                    secondary={`${item.subtitle}${item.date ? ` - ${toDisplayDate(item.date)}` : ''}`}
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
