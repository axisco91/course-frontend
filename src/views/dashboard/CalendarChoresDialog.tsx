import { useEffect, useMemo, useRef, useState, useContext } from 'react'
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Box, Typography, IconButton } from '@mui/material'
import Icon from 'src/@core/components/icon'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

import { useDispatch } from 'react-redux'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer' // ✅ ajusta nombre/path
import { getActiveTrainingContractElements } from 'src/api/api'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
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

const isPastCalendarDay = (date: string) => {
  if (!date) return false
  const d = dayjs(date, 'YYYY-MM-DD', true)
  if (!d.isValid()) return false

  return d.endOf('day').valueOf() < dayjs().startOf('day').valueOf()
}

const hasRegisteredCourse = (item: any) => item?.course_id != null || item?.course?.id != null || item?.courseId != null

const getTrainingElementStart = (item: any) =>
  ymd(
    item?.course?.beginning ??
      item?.course?.start_date ??
      item?.course?.start ??
      item?.course_beginning ??
      item?.course_start ??
      item?.start_date ??
      item?.beginning_formation ??
      item?.beginning ??
      item?.start
  )

const getTrainingElementEnd = (item: any) =>
  ymd(
    item?.course?.end ??
      item?.course?.end_date ??
      item?.course?.ending ??
      item?.course?.finish ??
      item?.course_end ??
      item?.end_date ??
      item?.end_formation ??
      item?.end ??
      item?.ending ??
      item?.finish
  )

const CalendarChoresDialog = ({
  open,
  onClose,
  selectedDate,
  events,
  elements: externalElements
}: {
  open: boolean
  onClose: () => void
  selectedDate: string | null
  events: any[]
  elements?: any[]
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const [elements, setElements] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (Array.isArray(externalElements) && externalElements.length > 0) return

    const load = async () => {
      setLoading(true)
      try {
        let page = 1
        let totalPages = 1
        const all: any[] = []

        while (page <= totalPages) {
          const res = await getActiveTrainingContractElements({ page, perPage: 500 })
          const list = res.data?.elements ?? res.data?.data?.elements ?? res.data?.data?.data ?? res.data?.data ?? []
          if (Array.isArray(list)) all.push(...list)

          const meta = res?.data?.data?.meta ?? res?.data?.meta
          if (!meta) break

          const current = Number(meta?.current_page ?? page)
          const last = Number(meta?.last_page ?? current)
          totalPages = Number.isFinite(last) && last > 0 ? last : current
          if (current >= totalPages) break
          page = current + 1
        }

        setElements(all)
      } catch (e) {
        handleErrorRef.current(e, logoutRef.current)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, externalElements])

  const day = selectedDate ? ymd(selectedDate) : ''
  const sourceElements = Array.isArray(externalElements) && externalElements.length > 0 ? externalElements : elements

  const choresForDay = useMemo(() => {
    if (!day) return []
    const list = Array.isArray(sourceElements) ? sourceElements : []
    if (list.length === 0) {
      const eventList = Array.isArray(events) ? events : []

      return eventList
        .filter((ev: any) => ev?.type === 'trainingContract' && ymd(ev?.start) === day)
        .map((ev: any) => ev?.meta?.raw)
        .filter(Boolean)
    }

    return list.filter((it: any) => {
      const start = getTrainingElementStart(it)
      const end = getTrainingElementEnd(it)

      return start === day || end === day
    })
  }, [sourceElements, events, day])

  const handleEye = (item: any) => {
    const id = item?.training_contract_id ?? item?.training_contract?.id ?? item?.id
    if (!id) return

    dispatch(trainingContractActions.setId(Number(id)))
    dispatch(trainingContractActions.openModal({ mode: 'view' }))
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>
        {t('Chores')} {selectedDate ? `- ${dayjs(selectedDate).format('DD MMMM YYYY')}` : ''}
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ py: 4 }}>
            <Typography>{t('Loading...')}</Typography>
          </Box>
        ) : choresForDay.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <Typography>{t('No chores for this day.')}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            {choresForDay.map((item: any, idx: number) => {
              const student = item?.student
                ? `${item.student.name ?? ''} ${item.student.surname ?? ''}`.trim()
                : item?.training_contract?.student != null
                ? `${item.training_contract.student.name ?? ''} ${item.training_contract.student.surname ?? ''}`.trim()
                : t('Student not found')

              const start = getTrainingElementStart(item)
              const end = getTrainingElementEnd(item)
              const isBeginning = start === day
              const taskDate = isBeginning ? start : end
              const isDone = isPastCalendarDay(taskDate)
              const registeredCourse = hasRegisteredCourse(item)

              return (
                <Box
                  key={`${item.id}-${idx}`}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: theme =>
                      `1px solid ${
                        registeredCourse || isDone ? '#c5e4e4' : theme.palette.divider
                      }`,
                    backgroundColor: registeredCourse || isDone ? '#edf8f7' : 'background.paper',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap'
                  }}
                >
                  <Box>
                    <Typography fontWeight={800}>{student}</Typography>

                    <Typography variant='body2' sx={{ mt: 1 }}>
                      <b>{isBeginning ? `${t('Beginning')}:` : `${t('End')}:`}</b>{' '}
                      {isBeginning ? start : end}
                    </Typography>

                    <Typography variant='body2'>
                      <b>{`${t('Training action')}:`}</b> {item.training_action_name ?? ''}
                    </Typography>

                    <Typography variant='body2'>
                      <b>{`${t('Hours')}:`}</b> {item.training_action_total_hours ?? ''}
                    </Typography>

                    {isBeginning ? (
                      <Typography variant='body2' color='text.secondary'>
                        {start} → {end}
                      </Typography>
                    ) : null}
                  </Box>

                <Box>
                    <IconButton onClick={() => handleEye(item)} title={t('View contract')}>
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

export default CalendarChoresDialog
