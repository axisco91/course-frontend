import { useMemo } from 'react'
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Box, Typography, IconButton } from '@mui/material'
import Icon from 'src/@core/components/icon'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { useDispatch } from 'react-redux'
import { tracingActions } from 'src/reducers/tracings/TracingReducer'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'
import { useTranslation } from 'react-i18next'

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
    t?.[`${key}_date_sent`],
    t?.course?.[`${key}_date_sent`],
    key === 'welcome' ? t?.follow_up_date : undefined,
    t?.[key]
  )

const tracingDates = (t: any) =>
  [
    firstValidYmd(t?.course_beginning, t?.course?.beginning, t?.follow_up_date, t?.created_at),
    getTracingDateByKey(t, 'quarter'),
    getTracingDateByKey(t, 'half'),
    getTracingDateByKey(t, 'three_quarters'),
    firstValidYmd(t?.course_end, t?.course?.end, getTracingDateByKey(t, 'final'))
  ].filter(Boolean)

const getEntryOrder = (entry: any) => {
  const dateKind = String(entry?.dateKind ?? '').toLowerCase()
  const title = String(entry?.title ?? '').toLowerCase()

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

const compareEntries = (a: any, b: any) => {
  const orderDiff = getEntryOrder(a) - getEntryOrder(b)
  if (orderDiff !== 0) return orderDiff

  return String(a?.studentName ?? '').localeCompare(String(b?.studentName ?? ''), 'es', { sensitivity: 'base' })
}

const normalizeKeyPart = (value: any) => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()

const getEntrySourcePriority = (entry: any) => {
  if (entry?.kind === 'tracing') return 0
  if (entry?.kind === 'mainContract') return 1
  if (entry?.kind === 'trainingContract') return 2

  return 3
}

const dedupeEntries = (entries: any[]) => {
  const bestByKey = new Map<string, any>()

  for (const entry of entries) {
    const key = [
      getEntryOrder(entry),
      normalizeKeyPart(entry?.studentName),
      normalizeKeyPart(entry?.courseLabel),
      normalizeKeyPart(entry?.companyLabel)
    ].join('|')

    const existing = bestByKey.get(key)
    if (!existing || getEntrySourcePriority(entry) < getEntrySourcePriority(existing)) {
      bestByKey.set(key, entry)
    }
  }

  return Array.from(bestByKey.values())
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
  const day = selectedDate ? ymd(selectedDate) : ''

  const entriesForDay = useMemo(() => {
    if (!day) return []

    if (Array.isArray(events) && events.length > 0) {
      return dedupeEntries(
        events
        .filter((event: any) => ymd(event?.start) === day)
        .filter((event: any) => ['tracing', 'mainContract', 'trainingContract'].includes(event?.type))
        .map((event: any, index: number) => {
          const tracing = event?.meta?.tracing
          if (tracing) {
            return {
              key: `tracing-${tracing?.id ?? index}-${event?.meta?.dateKind ?? event?.title ?? index}`,
              kind: 'tracing',
              title: event?.title ?? '',
              dateKind: event?.meta?.dateKind ?? '',
              studentName: `${tracing?.student_name ?? tracing?.student?.name ?? ''} ${
                tracing?.student_surname ?? tracing?.student?.surname ?? ''
              }`.trim(),
              courseLabel:
                typeof tracing?.course === 'string' ? tracing.course : tracing?.course?.name ?? tracing?.course_name ?? '',
              companyLabel:
                typeof tracing?.company === 'string'
                  ? tracing.company
                  : tracing?.company?.name ?? tracing?.company_name ?? '',
              typeLabel:
                tracing?.course_type ??
                tracing?.course_type_name ??
                tracing?.course?.course_type?.name ??
                tracing?.course?.type?.name ??
                '',
              tracingId: Number(tracing?.id ?? tracing?.value)
            }
          }

          const raw = event?.meta?.raw
          const trainingContractId = Number(
            event?.meta?.training_contract_id ?? raw?.training_contract_id ?? raw?.training_contract?.id ?? NaN
          )
          const studentName =
            raw?.student != null
              ? `${raw.student.name ?? ''} ${raw.student.surname ?? ''}`.trim()
              : raw?.training_contract?.student != null
              ? `${raw.training_contract.student.name ?? ''} ${raw.training_contract.student.surname ?? ''}`.trim()
              : String(event?.title ?? '').split('-')[0].trim()

          return {
            key: `contract-${trainingContractId}-${event?.title ?? index}-${index}`,
            kind: event?.type === 'mainContract' ? 'mainContract' : 'trainingContract',
            title: event?.title ?? '',
            dateKind: '',
            studentName,
            courseLabel: raw?.course_name ?? '',
            companyLabel: raw?.company_name ?? '',
            typeLabel: raw?.type_label ?? '',
            trainingContractId
          }
        })
        .filter(Boolean)
        .sort(compareEntries)
      )
    }

    const source = Array.isArray(tracings) ? tracings : []
    const unique = source.reduce((acc: any[], item: any) => {
      const id = Number(item?.id ?? item?.value)
      if (!Number.isFinite(id)) return acc
      if (acc.some(existing => Number(existing?.tracingId) === id)) return acc

      acc.push({
        key: `tracing-${id}`,
        kind: 'tracing',
        title: '',
        studentName: `${item?.student_name ?? item?.student?.name ?? ''} ${item?.student_surname ?? item?.student?.surname ?? ''}`.trim(),
        courseLabel: typeof item?.course === 'string' ? item.course : item?.course?.name ?? item?.course_name ?? '',
        companyLabel: typeof item?.company === 'string' ? item.company : item?.company?.name ?? item?.company_name ?? '',
        typeLabel:
          item?.course_type ?? item?.course_type_name ?? item?.course?.course_type?.name ?? item?.course?.type?.name ?? '',
        tracingId: id,
        tracing: item
      })

      return acc
    }, [])

    return unique.filter((entry: any) => {
        const tracing = entry?.tracing

        return tracing && Number(tracing?.course_status_id ?? tracing?.course?.course_status_id) !== 4 && tracingDates(tracing).includes(day)
      }).sort(compareEntries)
  }, [tracings, events, day])

  const handleEye = (entry: any) => {
    if (entry?.kind === 'mainContract' || entry?.kind === 'trainingContract') {
      const trainingContractId = Number(entry?.trainingContractId)
      if (!Number.isFinite(trainingContractId)) return

      dispatch(trainingContractActions.setId(trainingContractId))
      dispatch(trainingContractActions.openModal({ mode: 'view' }))

      return
    }

    const tracingId = Number(entry?.tracingId)
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
        {entriesForDay.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <Typography>{t('No tracings for this day.')}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            {entriesForDay.map((entry: any) => {
              return (
                <Box
                  key={entry.key}
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
                    <Typography fontWeight={800}>{entry.studentName}</Typography>
                    {entry.title ? <Typography variant='body2'>{entry.title}</Typography> : null}
                    {entry.courseLabel ? (
                      <Typography variant='body2'>
                        {`${t('Course')}:`} {entry.courseLabel}
                      </Typography>
                    ) : null}
                    {entry.companyLabel ? (
                      <Typography variant='body2'>
                        {`${t('Company')}:`} {entry.companyLabel}
                      </Typography>
                    ) : null}
                    {entry.typeLabel ? (
                      <Typography variant='body2'>
                        {`${t('Type')}:`} {entry.typeLabel}
                      </Typography>
                    ) : null}
                  </Box>

                  <Box>
                    <IconButton onClick={() => handleEye(entry)} title={t('View')}>
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
