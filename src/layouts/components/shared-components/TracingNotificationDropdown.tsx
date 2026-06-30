import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, IconButton, List, ListItemButton, ListItemText, Menu, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { getDashboardTracingNotifications } from 'src/api/api'
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
        const res = await getDashboardTracingNotifications({ date: ymd(new Date()) })
        if (active) setTracings(res?.data?.data?.notifications ?? [])
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
    return (Array.isArray(tracings) ? tracings : []).filter(
      (notification: any) => Number.isFinite(Number(notification?.id)) && notification?.date === today
    )
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
