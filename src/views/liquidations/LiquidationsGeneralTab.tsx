// LiquidationsGeneralTab.tsx
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

// ✅ APIs
import { getLiquidation, editLiquidation, createLiquidation } from 'src/api/api'

// ✅ reducer
import { liquidationActions } from 'src/reducers/liquidations/LiquidationReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string
type List = { id: number; name: string }

// ✅ tus estados reales
const STATUS_OPTIONS = [
  { id: 1, name: 'PENDIENTE' },
  { id: 2, name: 'ENVIADA' },
  { id: 3, name: 'RECIBIDA' },
  { id: 4, name: 'PAGADA' }
] as const

type StatusId = (typeof STATUS_OPTIONS)[number]['id']

const getPaidLabel = (value: any, t: TranslationFunction) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  const isPaid =
    value === true || normalized === '1' || normalized === 'true' || normalized === 'paid' || normalized === 'pagado'

  return isPaid ? t('Paid') : t('Pending')
}

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    company: yup.mixed<List>().nullable().required(t('Company is required')),
    course: yup.mixed<List>().nullable().required(t('Course is required')),
    status: yup.number().required(t('Status is required')),
    bill_number: yup.string().nullable(),
    paid_date: yup.string().nullable(),
    invoice_date: yup.string().nullable()
  })

type FormValues = {
  company: List | null
  course: List | null

  // NO editables (pero se envían)
  beginning: string
  end: string
  price: number | string
  paid: number | string
  commission_percent: number | string
  commission: number | string
  advisor: List | null

  // editables
  paid_date: string
  invoice_date: string
  bill_number: string
  status: StatusId
}

interface LiquidationsGeneralTabProps {
  open: boolean
  mode: Mode
  liquidationId: number | null
  onLoaded?: (liquidation: any) => void
  onClose?: () => void
}

const LiquidationsGeneralTab: React.FC<LiquidationsGeneralTabProps> = ({
  open,
  mode,
  liquidationId,
  onLoaded,
  onClose
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const userPermissions = useSelector((s: RootState) => s.auth.permissions) as string[]
  const canReadCompanies =
    Array.isArray(userPermissions) &&
    (userPermissions.includes('read.companies') || userPermissions.includes('read.management'))

  // ✅ LISTAS DESDE REDUX
  const companies = useSelector((s: RootState) => (s.company as any)?.companies ?? []) as List[]
  const courses = useSelector((s: RootState) => (s.course as any)?.courses ?? []) as List[]
  const advisors = useSelector((s: RootState) => (s.advisor as any)?.advisors ?? []) as List[]

  const companiesList = useMemo(() => (Array.isArray(companies) ? companies : []), [companies])
  const coursesList = useMemo(() => (Array.isArray(courses) ? courses : []), [courses])
  const advisorsList = useMemo(() => (Array.isArray(advisors) ? advisors : []), [advisors])

  const readOnly = mode === 'view'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      company: null,
      course: null,

      beginning: '',
      end: '',
      price: '',
      paid: 0,
      commission_percent: '',
      commission: '',
      advisor: null,

      paid_date: '',
      invoice_date: '',
      bill_number: '',
      status: 1
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
    resolver: yupResolver(schema(t)),
    shouldUnregister: false // ✅ CLAVE: aunque estén disabled/si cambias render, no se pierden
  })

  const pick = (list: List[], id: any) => (id != null ? list.find(x => x.id === Number(id)) ?? null : null)
  const openCompanyModal = (companyId?: number | null) => {
    if (!companyId || !canReadCompanies) return
    dispatch(companyActions.setId(Number(companyId)))
    dispatch(companyActions.openModal({ mode: 'view', companyId: Number(companyId) }))
  }

  // ✅ reglas de disabled
  const disabledAll = readOnly || loading || saving

  // SOLO estos editables (según lo que pediste)
  const disabledCompany = disabledAll
  const disabledCourse = disabledAll
  const disabledPaidDate = disabledAll
  const disabledInvoiceDate = disabledAll
  const disabledStatus = disabledAll
  const disabledBillNumber = disabledAll

  // SIEMPRE disabled visualmente
  const alwaysDisabled = true

  // ----------------------------
  // load liquidation (edit/view)
  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)
      
return
    }

    if (!liquidationId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getLiquidation(liquidationId)
        if (cancelled) return

        const l = res.data?.data?.liquidation ?? res.data?.data ?? res.data?.liquidation ?? null
        if (!l) throw new Error('Liquidation payload not found')

        onLoaded?.(l)

        reset({
          company: pick(companiesList, l.company_id),
          course: pick(coursesList, l.course_id),

          beginning: (l.beginning ?? l.start_date ?? '')?.slice?.(0, 10) ?? String(l.beginning ?? l.start_date ?? ''),
          end: (l.end ?? l.end_date ?? '')?.slice?.(0, 10) ?? String(l.end ?? l.end_date ?? ''),
          price: l.price ?? '',
          paid: l.paid ?? 0,
          commission_percent: l.commission_percent ?? '',
          commission: l.commission ?? '',
          advisor: pick(advisorsList, l.advisor_id),

          paid_date: (l.paid_date ?? '')?.slice?.(0, 10) ?? String(l.paid_date ?? ''),
          invoice_date: (l.invoice_date ?? '')?.slice?.(0, 10) ?? String(l.invoice_date ?? ''),
          bill_number: String(l.bill_number ?? ''),
          status: Number(l.status ?? 1) as StatusId
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
  }, [open, mode, liquidationId])

  // ----------------------------
  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (readOnly) return
    setSaving(true)

    try {
      const formData = new FormData()

      // ✅ editables
      formData.append('company_id', data.company?.id != null ? String(data.company.id) : '')
      formData.append('course_id', data.course?.id != null ? String(data.course.id) : '')
      formData.append('paid_date', data.paid_date ?? '')
      formData.append('invoice_date', data.invoice_date ?? '')
      formData.append('bill_number', data.bill_number ?? '')
      formData.append('status', String(data.status ?? 1))

      // ✅ NO editables PERO SE ENVÍAN IGUAL (lo que me pediste)
      formData.append('beginning', String(data.beginning ?? ''))
      formData.append('end', String(data.end ?? ''))
      formData.append('price', String(data.price ?? ''))
      formData.append('paid', String(data.paid ?? 0))
      formData.append('commission_percent', String(data.commission_percent ?? ''))
      formData.append('commission', String(data.commission ?? ''))
      formData.append('advisor_id', data.advisor?.id != null ? String(data.advisor.id) : '')

      if (mode === 'create') {
        const response = await createLiquidation(formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())

          const newId = response.data?.data?.liquidation?.id ?? response.data?.data?.id
          if (newId) {
            if (liquidationActions?.setId) dispatch(liquidationActions.setId(Number(newId)))
            if (liquidationActions?.openModal) {
              dispatch(liquidationActions.openModal({ mode: 'edit', liquidationId: Number(newId) }))
            }
          }
        }
      } else if (mode === 'edit' && liquidationId) {
        const response = await editLiquidation(liquidationId, formData)
        if (response.data?.success) {
          toast.success(response.data?.message ?? t('Saved'))
          dispatch(generalActions.addFilterButtonClickCount())
        }
      }
    } catch (error) {
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Fragment>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Box sx={{ mb: 6 }}>
          <Typography variant='h6'>{t('Liquidation')}</Typography>
        </Box>

        <Grid container spacing={5}>
          {/* FILA 1 */}
          <Grid item xs={12} md={4}>
            <Controller
              name='company'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={companiesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={disabledCompany}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component='span' sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                            {t('Company')}
                          </Typography>
                          {canReadCompanies && field.value?.id ? (
                            <Box
                              role='button'
                              aria-label={t('View company')}
                              onMouseDown={e => e.preventDefault()}
                              onClick={e => {
                                e.stopPropagation()
                                openCompanyModal(field.value?.id ?? null)
                              }}
                              sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                              <Icon icon='tabler:eye' fontSize={18} />
                            </Box>
                          ) : null}
                        </Box>
                      }
                      disabled={disabledCompany}
                      inputProps={{ ...params.inputProps, readOnly: disabledCompany }}
                      error={Boolean(errors.company)}
                      helperText={(errors.company as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
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
                  disabled={disabledCourse}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Courses')}
                      disabled={disabledCourse}
                      inputProps={{ ...params.inputProps, readOnly: disabledCourse }}
                      error={Boolean(errors.course)}
                      helperText={(errors.course as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='paid'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Paid')}
                  value={getPaidLabel(field.value, t)}
                  disabled={alwaysDisabled}
                  inputProps={{ readOnly: true }}
                />
              )}
            />
          </Grid>

          {/* FILA 2 */}
          <Grid item xs={12} md={4}>
            <Controller
              name='beginning'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Start date')} {...field} disabled={alwaysDisabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='end'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('End date')} {...field} disabled={alwaysDisabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='price'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Price')} {...field} disabled={alwaysDisabled} />
              )}
            />
          </Grid>

          {/* FILA 3 */}
          <Grid item xs={12} md={4}>
            <Controller
              name='commission_percent'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Commission %')} {...field} disabled={alwaysDisabled} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='advisor'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={advisorsList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={alwaysDisabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Advisor')}
                      disabled={alwaysDisabled}
                      inputProps={{ ...params.inputProps, readOnly: true }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name='commission'
              control={control}
              render={({ field }) => (
                <CustomTextField fullWidth label={t('Commission amount')} {...field} disabled={alwaysDisabled} />
              )}
            />
          </Grid>

          {/* FILA 4 */}
          <Grid item xs={12} md={6}>
            <Controller
              name='paid_date'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='date'
                  label={t('Liquidation date')}
                  InputLabelProps={{ shrink: true }}
                  {...field}
                  disabled={disabledPaidDate}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='invoice_date'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  type='date'
                  label={t('Invoice date')}
                  InputLabelProps={{ shrink: true }}
                  {...field}
                  disabled={disabledInvoiceDate}
                />
              )}
            />
          </Grid>

          {/* FILA 5 */}
          <Grid item xs={12} md={4}>
            <Controller
              name='bill_number'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Bill number')}
                  {...field}
                  disabled={disabledBillNumber}
                  error={Boolean(errors.bill_number)}
                  helperText={(errors.bill_number as any)?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Controller
              name='status'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  select
                  fullWidth
                  label={t('Status')}
                  {...field}
                  disabled={disabledStatus}
                  error={Boolean(errors.status)}
                  helperText={(errors.status as any)?.message}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            />
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

export default LiquidationsGeneralTab
