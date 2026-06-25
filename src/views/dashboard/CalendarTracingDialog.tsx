import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Box, Typography, IconButton } from '@mui/material'
import Icon from 'src/@core/components/icon'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { useDispatch } from 'react-redux'
import { tracingActions } from 'src/reducers/tracings/TracingReducer'
import { useTranslation } from 'react-i18next'
import { getTracings } from 'src/api/api'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

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
    // Usar *_sent solo como último recurso: para calendario manda la fecha real del hito.
    t?.[`${key}_date_sent`],
    t?.course?.[`${key}_date_sent`],
    key === 'welcome' ? t?.follow_up_date : undefined,
    t?.[key]
  )

const tracingDates = (t: any) =>
  [
    getTracingDateByKey(t, 'welcome'),
    getTracingDateByKey(t, 'quarter'),
    getTracingDateByKey(t, 'half'),
    getTracingDateByKey(t, 'three_quarters'),
    getTracingDateByKey(t, 'final'),
    firstValidYmd(t?.follow_up_date, t?.course?.beginning, t?.created_at)
  ].filter(Boolean)
const pickArray = (...candidates: any[]) => {
  for (const c of candidates) {
    if (Array.isArray(c)) return c
    if (Array.isArray(c?.data)) return c.data
    if (Array.isArray(c?.rows)) return c.rows
  }

  return []
}

const CalendarTracingDialog = ({
  open,
  onClose,
  selectedDate,
  events,
  tracings
}: {
  open: boolean
  onClose: () => void
  selectedDate: string | null
  events: any[]
  tracings: any[]
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const [loading, setLoading] = useState(false)
  const [tracingsList, setTracingsList] = useState<any[]>([])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const fetchAllTracings = async () => {
      setLoading(true)
      try {
        let page = 1
        let totalPages = 1
        const all: any[] = []

        while (page <= totalPages) {
          const res = await getTracings({ page, perPage: 500 })
          const rows = pickArray(
            res?.data?.data?.tracings,
            res?.data?.tracings,
            res?.data?.data?.data,
            res?.data?.data,
            res?.data,
            res?.data?.data?.items,
            res?.data?.items
          )
          if (Array.isArray(rows)) all.push(...rows)

          const meta = res?.data?.data?.meta ?? res?.data?.meta
          if (!meta) break

          const current = Number(meta?.current_page ?? page)
          const last = Number(meta?.last_page ?? current)
          totalPages = Number.isFinite(last) && last > 0 ? last : current
          if (current >= totalPages) break
          page = current + 1
        }

        if (!cancelled) setTracingsList(all)
      } catch (e) {
        if (!cancelled) handleErrorRef.current(e, logoutRef.current)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAllTracings()

    return () => {
      cancelled = true
    }
  }, [open])

  const day = selectedDate ? ymd(selectedDate) : ''

  const tracingsForDay = useMemo(() => {
    if (!day) return []
    const source = Array.isArray(tracings) && tracings.length > 0 ? tracings : tracingsList
    return source
      .filter(t => Number(t?.course_status_id ?? t?.course?.course_status_id) !== 4)
      .filter(t => tracingDates(t).includes(day))
  }, [tracings, tracingsList, day])

  const handleEye = (tracing: any) => {
    const tracingId = Number(tracing?.id ?? tracing?.value)
    if (!Number.isFinite(tracingId)) return

    dispatch(tracingActions.setId(tracingId))
    dispatch(tracingActions.openModal({ mode: 'view', courseId: tracingId }))
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>
        {t('Tracings')} {selectedDate ? `- ${dayjs(selectedDate).format('DD MMMM YYYY')}` : ''}
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ py: 4 }}>
            <Typography>{t('Loading...')}</Typography>
          </Box>
        ) : tracingsForDay.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <Typography>{t('No tracings for this day.')}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            {tracingsForDay.map((tracing: any, index: number) => {
              const studentName = `${tracing?.student_name ?? tracing?.student?.name ?? ''} ${
                tracing?.student_surname ?? tracing?.student?.surname ?? ''
              }`.trim()
              const courseLabel =
                typeof tracing?.course === 'string' ? tracing.course : tracing?.course?.name ?? tracing?.course_name ?? ''
              const companyLabel =
                typeof tracing?.company === 'string' ? tracing.company : tracing?.company?.name ?? tracing?.company_name ?? ''
              const typeLabel =
                tracing?.course_type ??
                tracing?.course_type_name ??
                tracing?.course?.course_type?.name ??
                tracing?.course?.type?.name ??
                ''

              return (
                <Box
                  key={`${tracing?.id ?? tracing?.value ?? index}-${index}`}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: theme => `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap'
                  }}
                >
                  <Box>
                    <Typography fontWeight={800}>{studentName}</Typography>
                    <Typography variant='body2'>
                      {`${t('Course')}:`} {courseLabel}
                    </Typography>
                    <Typography variant='body2'>
                      {`${t('Company')}:`} {companyLabel}
                    </Typography>
                    <Typography variant='body2'>
                      {`${t('Type')}:`} {typeLabel}
                    </Typography>
                  </Box>

                  <Box>
                    <IconButton onClick={() => handleEye(tracing)} title={t('View')}>
                      <Icon icon='tabler:eye' fontSize={20} />
                    </IconButton>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalendarTracingDialog
