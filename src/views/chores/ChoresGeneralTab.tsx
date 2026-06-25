// ChoresGeneralTab.tsx
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Box, Button, Grid, Typography, MenuItem } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// ✅ APIs (renombra a tus exports reales)
import { getChore, editChore } from 'src/api/api'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string }

// --------- status options (según tu UI "Pendiente")
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'done', label: 'Hecho' },
  { value: 'na', label: 'No aplica' }
] as const

type StatusValue = (typeof STATUS_OPTIONS)[number]['value']

const normalizeStatus = (value: any): StatusValue => {
  const v = String(value ?? '')
    .trim()
    .toLowerCase()

  if (v === 'pending' || v === 'pendiente') return 'pending'
  if (v === 'done' || v === 'hecho' || v === 'completed' || v === 'completado') return 'done'
  if (v === 'na' || v === 'n/a' || v === 'no aplica' || v === 'not applicable' || v === 'not_applicable')
    return 'na'

  return 'pending'
}

// ---- validation mínima (ajusta si quieres)
const schema = (t: TranslationFunction) =>
  yup.object().shape({
    course: yup.mixed<List>().nullable().required(t('Course is required')),
    student: yup.mixed<List>().nullable().required(t('Student is required'))
  })

type FormValues = {
  course: List | null
  company: List | null
  student: List | null
  training_contract_element: List | null

  student_name: string
  student_surname: string

  membership_tab_status: StatusValue
  membership_tab_date: string

  economic_proposal_status: StatusValue
  economic_proposal_date: string

  student_tab_status: StatusValue
  student_tab_date: string

  welcome_guid_status: StatusValue
  welcome_guid_date: string

  registration_status: StatusValue
  registration_date: string

  diploma_status: StatusValue
  diploma_status_date: string

  start_communication_status: StatusValue
  start_communication_date: string

  close_communication_status: StatusValue
  close_communication_date: string

  invoiced_status: StatusValue
  invoiced_date: string

  bonus_sent_status: StatusValue
  bonus_sent_date: string

  send_doc_status: StatusValue
  send_doc_date: string

  tutor_guide_status: StatusValue
  tutor_guide_date: string

  quarter_date_sent: string
  half_date_sent: string
  three_quarters_date_sent: string
  final_date_sent: string
}

interface ChoresGeneralTabProps {
  open: boolean
  mode: Mode
  choreId: number | null
  onLoaded?: (chore: any) => void
  onClose?: () => void
}

const ChoresGeneralTab: React.FC<ChoresGeneralTabProps> = ({ open, mode, choreId, onLoaded, onClose }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ✅ LISTAS DESDE REDUX (AJUSTA paths a los tuyos)
  const courses = useSelector((s: RootState) => (s.course as any)?.courses ?? []) as List[]
  const companies = useSelector((s: RootState) => (s.company as any)?.companies ?? []) as List[]
  const students = useSelector((s: RootState) => (s.student as any)?.students ?? []) as any[] // puede que student tenga nombre/apellidos

  const coursesList = useMemo(() => (Array.isArray(courses) ? courses : []), [courses])
  const companiesList = useMemo(() => (Array.isArray(companies) ? companies : []), [companies])
  const studentsList = useMemo(() => (Array.isArray(students) ? students : []), [students])

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      course: null,
      company: null,
      student: null,
      training_contract_element: null,

      student_name: '',
      student_surname: '',

      membership_tab_status: 'pending',
      membership_tab_date: '',

      economic_proposal_status: 'pending',
      economic_proposal_date: '',

      student_tab_status: 'pending',
      student_tab_date: '',

      welcome_guid_status: 'pending',
      welcome_guid_date: '',

      registration_status: 'pending',
      registration_date: '',

      diploma_status: 'pending',
      diploma_status_date: '',

      start_communication_status: 'pending',
      start_communication_date: '',

      close_communication_status: 'pending',
      close_communication_date: '',

      invoiced_status: 'pending',
      invoiced_date: '',

      bonus_sent_status: 'pending',
      bonus_sent_date: '',

      send_doc_status: 'pending',
      send_doc_date: '',

      tutor_guide_status: 'pending',
      tutor_guide_date: '',

      quarter_date_sent: '',
      half_date_sent: '',
      three_quarters_date_sent: '',
      final_date_sent: ''
    }),
    []
  )

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema(t))
  })

  const disabled = readOnly || loading || saving

  // ✅ helper: buscar entidad por id
  const pick = (list: List[], id: any) => (id != null ? list.find(x => x.id === Number(id)) ?? null : null)

  // ----------------------------
  // ✅ load chore on open (edit/view)
  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!choreId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getChore(choreId)
        if (cancelled) return

        console.log(res.data?.data?.chore)

        const c = res.data?.data?.chore ?? res.data?.data ?? res.data?.chore ?? null
        if (!c) throw new Error('Chore payload not found')

        onLoaded?.(c)

        // si tu API trae student embebido, úsalo para nombre/apellidos
        const studentObj = pick(studentsList as any, c.student_id) ?? c.student ?? null

        const studentName = studentObj?.name
        const studentSurname = studentObj?.surname

        reset({
          course: pick(coursesList, c.course_id),
          company: pick(companiesList, c.company_id),
          student: studentObj
            ? ({ id: studentObj.id, name: studentObj.name ?? studentObj.first_name ?? '' } as any)
            : pick(studentsList as any, c.student_id),

          student_name: String(studentName ?? ''),
          student_surname: String(studentSurname ?? ''),

          membership_tab_status: normalizeStatus(c.membership_tab_status),
          membership_tab_date: (c.membership_tab_date ?? '').slice(0, 10),

          economic_proposal_status: normalizeStatus(c.economic_proposal_status),
          economic_proposal_date: (c.economic_proposal_date ?? '').slice(0, 10),

          student_tab_status: normalizeStatus(c.student_tab_status),
          student_tab_date: (c.student_tab_date ?? '').slice(0, 10),

          welcome_guid_status: normalizeStatus(c.welcome_guid_status),
          welcome_guid_date: (c.welcome_guid_date ?? '').slice(0, 10),

          registration_status: normalizeStatus(c.registration_status),
          registration_date: (c.registration_date ?? '').slice(0, 10),

          diploma_status: normalizeStatus(c.diploma_status),
          diploma_status_date: (c.diploma_status_date ?? '').slice(0, 10),

          start_communication_status: normalizeStatus(c.start_communication_status),
          start_communication_date: (c.start_communication_date ?? '').slice(0, 10),

          close_communication_status: normalizeStatus(c.close_communication_status),
          close_communication_date: (c.close_communication_date ?? '').slice(0, 10),

          invoiced_status: normalizeStatus(c.invoiced_status),
          invoiced_date: (c.invoiced_date ?? '').slice(0, 10),

          bonus_sent_status: normalizeStatus(c.bonus_sent_status),
          bonus_sent_date: (c.bonus_sent_date ?? '').slice(0, 10),

          send_doc_status: normalizeStatus(c.send_doc_status),
          send_doc_date: (c.send_doc_date ?? '').slice(0, 10),

          tutor_guide_status: normalizeStatus(c.tutor_guide_status),
          tutor_guide_date: (c.tutor_guide_date ?? '').slice(0, 10),

          quarter_date_sent: (c.quarter_date_sent ?? '').slice(0, 10),
          half_date_sent: (c.half_date_sent ?? '').slice(0, 10),
          three_quarters_date_sent: (c.three_quarters_date_sent ?? '').slice(0, 10),
          final_date_sent: (c.final_date_sent ?? '').slice(0, 10)
        })
      } catch (error) {
        if (!cancelled) handleError(error, logout)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, choreId])

  // ----------------------------
  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    if (!choreId) return // solo update (según dices)

    setSaving(true)
    try {
      const formData = new FormData()

      formData.append('course_id', data.course?.id != null ? String(data.course.id) : '')
      formData.append('company_id', data.company?.id != null ? String(data.company.id) : '')
      formData.append('student_id', data.student?.id != null ? String(data.student.id) : '')
      formData.append(
        'training_contract_element_id',
        data.training_contract_element?.id != null ? String(data.training_contract_element.id) : ''
      )

      // status + dates
      const pairs: Array<[keyof FormValues, keyof FormValues]> = [
        ['membership_tab_status', 'membership_tab_date'],
        ['economic_proposal_status', 'economic_proposal_date'],
        ['student_tab_status', 'student_tab_date'],
        ['welcome_guid_status', 'welcome_guid_date'],
        ['registration_status', 'registration_date'],
        ['diploma_status', 'diploma_status_date'],
        ['start_communication_status', 'start_communication_date'],
        ['close_communication_status', 'close_communication_date'],
        ['invoiced_status', 'invoiced_date'],
        ['bonus_sent_status', 'bonus_sent_date'],
        ['send_doc_status', 'send_doc_date'],
        ['tutor_guide_status', 'tutor_guide_date']
      ]

      pairs.forEach(([sKey, dKey]) => {
        formData.append(String(sKey), normalizeStatus(data[sKey]))
        formData.append(String(dKey), String(data[dKey] ?? ''))
      })

      // extra dates
      formData.append('quarter_date_sent', data.quarter_date_sent ?? '')
      formData.append('half_date_sent', data.half_date_sent ?? '')
      formData.append('three_quarters_date_sent', data.three_quarters_date_sent ?? '')
      formData.append('final_date_sent', data.final_date_sent ?? '')

      const response = await editChore(choreId, formData)
      if (response.data?.success) {
        toast.success(response.data.message ?? t('Saved'))
        dispatch(generalActions.addFilterButtonClickCount())
      }
    } catch (error) {
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  // ----------------------------
  const renderStatus = (name: keyof FormValues, label: string) => (
    <Controller
      name={name as any}
      control={control}
      render={({ field }) => (
        <CustomTextField select fullWidth label={t(label)} {...field} disabled={disabled}>
          {STATUS_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {t(opt.label)}
            </MenuItem>
          ))}
        </CustomTextField>
      )}
    />
  )

  const renderDate = (name: keyof FormValues, label: string) => (
    <Controller
      name={name as any}
      control={control}
      render={({ field }) => (
        <CustomTextField
          fullWidth
          type='date'
          label={t(label)}
          InputLabelProps={{ shrink: true }}
          {...field}
          disabled={disabled}
        />
      )}
    />
  )

  // ----------------------------
  return (
    <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {/* ====== DATOS (fila superior) ====== */}
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Data')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* Nombre (SIEMPRE disabled) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='student_name'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Name')} {...field} disabled />}
            />
          </Grid>

          {/* Apellidos (SIEMPRE disabled) */}
          <Grid item xs={12} md={3}>
            <Controller
              name='student_surname'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label={t('Surnames')} {...field} disabled />}
            />
          </Grid>

          {/* Curso (SIEMPRE disabled visualmente) -> mostramos autocomplete pero bloqueado */}
          <Grid item xs={12} md={6}>
            <Controller
              name='course'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={coursesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled // 👈 siempre disabled
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Course')}
                      placeholder={t('Course')}
                      disabled
                      inputProps={{ ...params.inputProps, readOnly: true }}
                      error={Boolean(errors.course)}
                      helperText={(errors.course as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* ====== ITINERARIO ====== */}
        <Box sx={{ mt: 10, mb: 6 }}>
          <Typography variant='h6'>{t('Task itinerary')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* Ficha Adhesión */}
          <Grid item xs={12} md={3}>
            {renderStatus('membership_tab_status', 'Membership form')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('membership_tab_date', 'Membership form date')}
          </Grid>

          {/* Propuesta Económica */}
          <Grid item xs={12} md={3}>
            {renderStatus('economic_proposal_status', 'Economic proposal')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('economic_proposal_date', 'Economic proposal date')}
          </Grid>

          {/* Ficha Alumno */}
          <Grid item xs={12} md={3}>
            {renderStatus('student_tab_status', 'Student form')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('student_tab_date', 'Student form date')}
          </Grid>

          {/* Guía Bienvenida */}
          <Grid item xs={12} md={3}>
            {renderStatus('welcome_guid_status', 'Welcome guide')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('welcome_guid_date', 'Welcome guide date')}
          </Grid>

          {/* Matriculación */}
          <Grid item xs={12} md={3}>
            {renderStatus('registration_status', 'Registration')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('registration_date', 'Registration date')}
          </Grid>

          {/* Diploma */}
          <Grid item xs={12} md={3}>
            {renderStatus('diploma_status', 'Diploma')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('diploma_status_date', 'Diploma date')}
          </Grid>

          {/* Comunicación Inicio */}
          <Grid item xs={12} md={3}>
            {renderStatus('start_communication_status', 'Start communication')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('start_communication_date', 'Start communication date')}
          </Grid>

          {/* Comunicación Cierre */}
          <Grid item xs={12} md={3}>
            {renderStatus('close_communication_status', 'Close communication')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('close_communication_date', 'Close communication date')}
          </Grid>

          {/* Facturado */}
          <Grid item xs={12} md={3}>
            {renderStatus('invoiced_status', 'Invoiced')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('invoiced_date', 'Invoiced date')}
          </Grid>

          {/* Bonificación Enviada */}
          <Grid item xs={12} md={3}>
            {renderStatus('bonus_sent_status', 'Bonus sent')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('bonus_sent_date', 'Bonus sent date')}
          </Grid>

          {/* Envío Doc */}
          <Grid item xs={12} md={3}>
            {renderStatus('send_doc_status', 'Send document')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('send_doc_date', 'Send document date')}
          </Grid>

          {/* Guía Tutor */}
          <Grid item xs={12} md={3}>
            {renderStatus('tutor_guide_status', 'Tutor guide')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('tutor_guide_date', 'Tutor guide date')}
          </Grid>

          {/* Hitos (solo fecha) */}
          <Grid item xs={12} md={3}>
            {renderDate('quarter_date_sent', 'Quarter date sent')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('half_date_sent', 'Half date sent')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('three_quarters_date_sent', 'Three quarters date sent')}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderDate('final_date_sent', 'Final date sent')}
          </Grid>
        </Grid>

        {mode !== 'view' && (
          <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', gap: 3 }}>
            <Button variant='contained' type='submit' disabled={saving || loading}>
              <Icon icon='tabler:device-floppy' fontSize={20} />
              {t('Save')}
            </Button>

            <Button variant='tonal' color='secondary' onClick={onClose} disabled={saving}>
              <Icon icon='tabler:x' fontSize={20} />
              {t('Cancel')}
            </Button>
          </Box>
        )}
      </form>

      {!saving && loading && <SavingDialog labelKey='Processing Data' />}

      {saving && <SavingDialog />}
    </Fragment>
  )
}

export default ChoresGeneralTab
