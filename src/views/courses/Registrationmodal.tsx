import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, Dialog, DialogContent, DialogTitle, Grid, IconButton, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'

import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import SavingDialog from '../components/SavingDialog'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// ✅ Ajusta a tus endpoints reales
import { createRegistration, updateRegistration, getRegistration } from 'src/api/api'

type Mode = 'create' | 'edit'
type TranslationFunction = (key: string) => string

type Student = {
  id: number
  name?: string
  surname?: string
  full_name?: string
  label?: string
}

type YesNo = 'yes' | 'no'

type FormValues = {
  student: Student | null
  price: number | string
  is_bonus: YesNo
}

interface RegistrationModalProps {
  open: boolean
  mode: Mode
  onClose: () => void
  onSaved?: () => void
  registrationId?: number | null
  courseId?: number | null
  companyId?: number | null
}

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    student: yup.mixed<Student>().nullable().required(t('Student is required')),
    price: yup
      .number()
      .typeError(t('Price must be a number'))
      .min(0, t('Price must be >= 0'))
      .required(t('Price is required')),
    is_bonus: yup.mixed<YesNo>().oneOf(['yes', 'no']).required(t('Is bonus is required'))
  })

const studentLabel = (s?: Student | null) => {
  if (!s) return ''
  
return s.label ?? s.full_name ?? `${s.name ?? ''} ${s.surname ?? ''}`.trim()
}

// ✅ convierte lo que venga del backend a yes/no
const asYesNo = (v: any): YesNo => {
  if (v === true) return 'yes'
  if (v === false) return 'no'
  if (v === 1 || v === '1' || v === 'yes') return 'yes'
  if (v === 0 || v === '0' || v === 'no') return 'no'
  
return 'no'
}

const pickStudent = (list: Student[], id: any) => {
  if (id == null) return null
  
return list.find(s => Number(s.id) === Number(id)) ?? null
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  open,
  mode,
  onClose,
  onSaved,
  registrationId = null,
  courseId = null,
  companyId = null
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ✅ Ajusta el selector a tu store real
  const students = useSelector((s: RootState) => (s as any).student?.students ?? []) as Student[]
  const studentsList = useMemo(() => (Array.isArray(students) ? students : []), [students])

  // ✅ opciones yes/no (Autocomplete)
  const yesNoOptions = useMemo<YesNo[]>(() => ['no', 'yes'], [])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      student: null,
      price: 0,
      is_bonus: 'no'
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

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  useEffect(() => {
    handleErrorRef.current = handleError
    logoutRef.current = logout
  }, [handleError, logout])

  useEffect(() => {
    if (!open) return

    // CREATE -> limpio
    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)
      
return
    }

    // EDIT -> cargo
    if (mode === 'edit' && !registrationId) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await getRegistration(registrationId as number)
        if (cancelled) return

        const data = res.data?.data
        const reg = data?.registration ?? data?.data ?? data ?? null

        const studentId = reg?.student_id ?? reg?.studentId ?? reg?.student?.id ?? reg?.student?.value ?? null
        const price = reg?.price ?? reg?.amount ?? reg?.total ?? 0

        // ✅ backend puede traer 0/1, "0"/"1", true/false...
        const isBonus = reg?.is_bonus ?? reg?.isBonus ?? reg?.bonus ?? reg?.bonificado ?? 0

        reset({
          student: pickStudent(studentsList, studentId),
          price: Number(price ?? 0),
          is_bonus: asYesNo(isBonus)
        })
      } catch (e) {
        if (!cancelled) handleErrorRef.current(e, logoutRef.current)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [open, mode, registrationId, reset, defaultValues, studentsList])

  const onSubmit: SubmitHandler<FormValues> = async data => {
    if (!open) return
    setSaving(true)

    try {
      const formData = new FormData()

      if (courseId != null) formData.append('course_id', String(courseId))
      if (companyId != null) formData.append('company_id', String(companyId))

      formData.append('student_id', data.student?.id != null ? String(data.student.id) : '')
      formData.append('price', String(data.price ?? 0))

      // ✅ AQUÍ el cambio: yes -> 1, no -> 0
      formData.append('is_bonus', data.is_bonus === 'yes' ? '1' : '0')

      if (mode === 'create') {
        const r = await createRegistration(formData)
        if (r.data?.success) toast.success(r.data?.message ?? t('Saved'))
      } else {
        if (!registrationId) return
        const r = await updateRegistration(registrationId, formData)
        if (r.data?.success) toast.success(r.data?.message ?? t('Saved'))
      }

      dispatch(generalActions.addFilterButtonClickCount())
      onSaved?.()
      onClose()
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setSaving(false)
    }
  }

  const disabled = loading || saving

  const autoCompleteInputProps = (params: any) => ({
    ...params.inputProps,
    readOnly: disabled
  })

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth='lg'
      onClose={() => {
        if (saving) return
        onClose()
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          {mode === 'create' ? t('New registration') : t('Edit registration')}
        </Typography>

        <IconButton
          onClick={() => {
            if (saving) return
            onClose()
          }}
        >
          <Icon icon='tabler:x' fontSize={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={4} sx={{ mt: 1 }}>
          {/* Student */}
          <Grid item xs={12} md={4}>
            <Controller
              name='student'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={studentsList}
                  getOptionLabel={o => studentLabel(o)}
                  isOptionEqualToValue={(o, v) => Number(o?.id) === Number(v?.id)}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Student')}
                      placeholder={t('Select...')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.student)}
                      helperText={(errors.student as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Price */}
          <Grid item xs={12} md={4}>
            <Controller
              name='price'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Price')}
                  placeholder='0.00'
                  {...field}
                  disabled={disabled}
                  type='number'
                  inputProps={{ step: '0.01' }}
                  error={Boolean(errors.price)}
                  helperText={(errors.price as any)?.message}
                />
              )}
            />
          </Grid>

          {/* Is bonus (Autocomplete yes/no) */}
          <Grid item xs={12} md={4}>
            <Controller
              name='is_bonus'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange((v ?? 'no') as YesNo)}
                  options={yesNoOptions}
                  getOptionLabel={opt => (opt === 'yes' ? t('Yes') : t('No'))}
                  isOptionEqualToValue={(o, v) => o === v}
                  disabled={disabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Is bonus')}
                      placeholder={t('Select...')}
                      disabled={disabled}
                      inputProps={autoCompleteInputProps(params)}
                      error={Boolean(errors.is_bonus)}
                      helperText={(errors.is_bonus as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Button variant='contained' type='button' disabled={disabled} onClick={handleSubmit(onSubmit)}>
            <Icon icon='tabler:device-floppy' fontSize={20} />
            <Box sx={{ ml: 2 }}>{t('Save')}</Box>
          </Button>

          <Button variant='tonal' color='secondary' type='button' disabled={disabled} onClick={onClose}>
            <Icon icon='tabler:x' fontSize={20} />
            <Box sx={{ ml: 2 }}>{t('Cancel')}</Box>
          </Button>
        </Box>

        {!saving && loading && <SavingDialog labelKey='Processing Data' />}

        {saving && <SavingDialog />}
      </DialogContent>
    </Dialog>
  )
}

export default RegistrationModal
