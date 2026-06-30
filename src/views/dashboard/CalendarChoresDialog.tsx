import { useMemo } from 'react'
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Box, Typography, IconButton } from '@mui/material'
import Icon from 'src/@core/components/icon'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

import { useDispatch } from 'react-redux'
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

  const day = selectedDate ? ymd(selectedDate) : ''

  const choresForDay = useMemo(() => {
    if (!day) return []
    const sourceElements = Array.isArray(externalElements) ? externalElements : []
    if (sourceElements.length > 0) {
      return sourceElements.filter((item: any) => {
        const start = getTrainingElementStart(item)
        const end = getTrainingElementEnd(item)

        return start === day || end === day
      })
    }

    return (Array.isArray(events) ? events : [])
      .filter((ev: any) => ['trainingContract', 'mainContract'].includes(ev?.type) && ymd(ev?.start) === day)
      .map((ev: any) => ev?.meta?.raw)
      .filter(Boolean)
      .reduce((acc: any[], item: any) => {
        const id = Number(item?.id ?? item?.training_contract_id ?? item?.training_contract?.id)
        if (!Number.isFinite(id)) return acc
        if (acc.some(existing => Number(existing?.id ?? existing?.training_contract_id ?? existing?.training_contract?.id) === id)) {
          return acc
        }
        acc.push(item)

        return acc
      }, [])
  }, [day, events, externalElements])

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
        {choresForDay.length === 0 ? (
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
                    border: theme => `1px solid ${registeredCourse || isDone ? '#c5e4e4' : theme.palette.divider}`,
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
