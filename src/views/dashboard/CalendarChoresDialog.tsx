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

const getStudentName = (item: any, fallback: string) =>
  item?.student != null
    ? `${item.student.name ?? ''} ${item.student.surname ?? ''}`.trim()
    : item?.training_contract?.student != null
    ? `${item.training_contract.student.name ?? ''} ${item.training_contract.student.surname ?? ''}`.trim()
    : fallback

const getContractHours = (item: any) => {
  const formationHours = Number(item?.formation_hours)
  if (Number.isFinite(formationHours) && formationHours > 0) return formationHours

  const firstYear = Number(item?.formative_hours_first_year)
  const secondYear = Number(item?.formative_hours_second_year)
  const yearlyHours = (Number.isFinite(firstYear) ? firstYear : 0) + (Number.isFinite(secondYear) ? secondYear : 0)
  if (yearlyHours > 0) return yearlyHours

  const totalHours = Number(item?.total_hours)
  if (Number.isFinite(totalHours) && totalHours > 0) return totalHours

  return ''
}

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
      return sourceElements
        .filter((item: any) => {
          const start = getTrainingElementStart(item)
          const end = getTrainingElementEnd(item)

          return start === day || end === day
        })
        .map((item: any, index: number) => {
          const start = getTrainingElementStart(item)
          const end = getTrainingElementEnd(item)
          const isBeginning = start === day

          return {
            key: `external-${item?.id ?? index}-${isBeginning ? 'start' : 'end'}`,
            item,
            student: getStudentName(item, t('Student not found')),
            kind: 'element',
            eventLabel: item?.event_label ?? (isBeginning ? t('Beginning') : t('End')),
            taskDate: isBeginning ? start : end,
            start,
            end,
            trainingActionName: item?.training_action_name ?? '',
            hoursLabel: item?.training_action_total_hours ?? '',
            companyName: item?.company_name ?? item?.training_contract?.company?.name ?? '',
            registeredCourse: hasRegisteredCourse(item),
            viewId: item?.training_contract_id ?? item?.training_contract?.id ?? item?.id
          }
        })
    }

    return (Array.isArray(events) ? events : [])
      .filter((ev: any) => ['trainingContract', 'mainContract'].includes(ev?.type) && ymd(ev?.start) === day)
      .map((ev: any, index: number) => {
        const item = ev?.meta?.raw
        if (!item) return null

        const isContractSummary = ev?.type === 'mainContract' || ev?.meta?.source === 'trainingContractMain'
        const start = getTrainingElementStart(item)
        const end = getTrainingElementEnd(item)

        return {
          key: `${ev?.type ?? 'event'}-${item?.id ?? item?.training_contract_id ?? index}-${item?.event_kind ?? index}`,
          item,
          student: getStudentName(item, t('Student not found')),
          kind: isContractSummary ? 'contract' : 'element',
          eventLabel: item?.event_label ?? ev?.title ?? '',
          taskDate: ymd(ev?.start) || start || end,
          start,
          end,
          trainingActionName: isContractSummary ? 'Contrato formativo' : item?.training_action_name ?? '',
          hoursLabel: isContractSummary ? getContractHours(item) : item?.training_action_total_hours ?? '',
          companyName: item?.company_name ?? '',
          registeredCourse: hasRegisteredCourse(item),
          viewId: item?.training_contract_id ?? item?.training_contract?.id ?? item?.id
        }
      })
      .filter(Boolean)
  }, [day, events, externalElements, t])

  const handleEye = (item: any) => {
    const id = item?.viewId ?? item?.training_contract_id ?? item?.training_contract?.id ?? item?.id
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
            {choresForDay.map((item: any) => {
              const isDone = isPastCalendarDay(item?.taskDate ?? '')
              const registeredCourse = Boolean(item?.registeredCourse)

              return (
                <Box
                  key={item.key}
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
                    <Typography fontWeight={800}>{item.student}</Typography>

                    <Typography variant='body2' sx={{ mt: 1 }}>
                      <b>{`${t('Type')}:`}</b> {item.eventLabel}
                    </Typography>

                    <Typography variant='body2'>
                      <b>{`${t('Date')}:`}</b> {item.taskDate}
                    </Typography>

                    <Typography variant='body2'>
                      <b>{`${t('Training action')}:`}</b> {item.trainingActionName}
                    </Typography>

                    <Typography variant='body2'>
                      <b>{`${t('Hours')}:`}</b> {item.hoursLabel}
                    </Typography>

                    {item.companyName ? (
                      <Typography variant='body2'>
                        <b>{`${t('Company')}:`}</b> {item.companyName}
                      </Typography>
                    ) : null}

                    {item.start || item.end ? (
                      <Typography variant='body2' color='text.secondary'>
                        {(item.start || '-') + ' -> ' + (item.end || '-')}
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
