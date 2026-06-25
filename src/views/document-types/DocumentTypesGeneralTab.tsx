import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, Checkbox, FormControlLabel, Grid, IconButton } from '@mui/material'
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

import { createdocument as createDocument, editDocument, getDocument } from 'src/api/api'
import { documentActions } from 'src/reducers/general/DocumentReducer'

type Mode = 'view' | 'edit' | 'create'
type TranslationFunction = (key: string) => string
type List = { id: number | string; name: string }

const schema = (t: TranslationFunction) =>
  yup.object().shape({
    name: yup.string().min(3, t('Name is too short')).required(t('Name is required')),
    document_type: yup.mixed<List>().nullable().required(t('Document type is required')),
    blade: yup.string().required(t('Blade is required')),
    description: yup.string().nullable(),
    signature: yup.boolean()
  })

type FormValues = {
  name: string
  document_type: List | null
  blade: string
  description: string
  signature: boolean
}

interface DocumentGeneralTabProps {
  open: boolean
  mode: Mode
  documentId: number | null
  onLoaded?: (document: any) => void
  onClose?: () => void
  onRequestEdit?: () => void
}

const DocumentTypesGeneralTab: React.FC<DocumentGeneralTabProps> = ({
  open,
  mode,
  documentId,
  onLoaded,
  onClose,
  onRequestEdit
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const documentTypes = useSelector((state: RootState) => state.documentType.documentTypes) as List[]
  const selectedDocument = useSelector((state: RootState) => state.document.selectedDocument)

  const normalizeType = (item: any): List | null => {
    if (!item || typeof item !== 'object') return null
    const id = item.id ?? item.value
    const name = item.name ?? item.label
    if (id == null || name == null) return null

    return {
      id,
      name: String(name)
    }
  }

  const documentTypesList = useMemo(() => {
    if (!Array.isArray(documentTypes)) return []

    return documentTypes.map(normalizeType).filter(Boolean) as List[]
  }, [documentTypes])

  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.management')

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [disable, setDisable] = useState(mode === 'view')

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      document_type: null,
      blade: '',
      description: '',
      signature: false
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
    shouldUnregister: false
  })

  const isDisabled = disable || saving || loading

  useEffect(() => {
    setDisable(mode === 'view')
  }, [mode, documentId, open])

  const pick = (list: List[], id: any) => (id != null ? list.find(x => String(x.id) === String(id)) ?? null : null)

  const mapDocumentToForm = (document: any): FormValues => {
    const typeId = document?.document_type_id ?? document?.document_type?.id ?? document?.document_type?.value ?? null
    const fallbackTypeName = document?.document_type_name ?? document?.document_type?.name ?? document?.document_type?.label ?? ''

    return {
      name: document?.name ?? '',
      document_type:
        pick(documentTypesList, typeId) ??
        (typeId
          ? {
              id: typeId,
              name: String(fallbackTypeName)
            }
          : null),
      blade: document?.blade ?? '',
      description: document?.description ?? '',
      signature: Number(document?.signature ?? 0) === 1
    }
  }

  useEffect(() => {
    if (!open || mode === 'create') return
    if (!selectedDocument) return

    reset(mapDocumentToForm(selectedDocument))
    onLoaded?.(selectedDocument)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, selectedDocument, documentTypesList])

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      reset(defaultValues)
      setLoading(false)

      return
    }

    if (!documentId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getDocument(documentId)
        if (cancelled) return

        const document = res.data?.data?.document ?? res.data?.data ?? res.data?.document ?? null
        if (!document) throw new Error('Document payload not found')

        onLoaded?.(document)

        reset(mapDocumentToForm(document))
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
  }, [open, mode, documentId, documentTypesList])

  const onFormSubmit: SubmitHandler<FormValues> = async data => {
    if (disable) return

    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('name', data.name ?? '')
      formData.append('document_type_id', data.document_type?.id != null ? String(data.document_type.id) : '')
      formData.append('blade', data.blade ?? '')
      formData.append('description', data.description ?? '')
      formData.append('signature', data.signature ? '1' : '0')

      let response
      if (!documentId) {
        response = await createDocument(formData)
      } else {
        response = await editDocument(documentId, formData)
      }

      const success = response?.data?.success ?? response?.status === 200

      if (success) {
        toast.success(response?.data?.message ?? t('Saved'))
        dispatch(generalActions.addFilterButtonClickCount())

        const savedDocument = response?.data?.data?.document ?? response?.data?.document ?? null
        if (savedDocument) {
          dispatch(documentActions.setSelectedDocument(savedDocument))
        }

        const newId = savedDocument?.id ?? response?.data?.data?.id
        if (!documentId && newId) {
          dispatch(documentActions.setId(Number(newId)))
        }

        onClose?.()
      } else {
        toast.error(response?.data?.message ?? t('Unable to save document'))
      }
    } catch (error) {
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = () => {
    if (!canUpdate) return
    setDisable(false)
    onRequestEdit?.()
  }

  return (
    <Fragment>
      {mode === 'view' && canUpdate && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton color='primary' onClick={handleEdit}>
            <Icon icon='tabler:pencil' fontSize={20} />
          </IconButton>
        </Box>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={12}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Name')}
                  placeholder={t('Name')}
                  {...field}
                  disabled={isDisabled}
                  error={Boolean(errors.name)}
                  helperText={(errors.name as any)?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='document_type'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  options={documentTypesList}
                  getOptionLabel={o => o?.name ?? ''}
                  isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
                  disabled={isDisabled}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label={t('Type')}
                      placeholder={t('Select...')}
                      error={Boolean(errors.document_type)}
                      helperText={(errors.document_type as any)?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name='blade'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label={t('Blade')}
                  placeholder={t('Blade')}
                  {...field}
                  disabled={isDisabled}
                  error={Boolean(errors.blade)}
                  helperText={(errors.blade as any)?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Controller
              name='signature'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t('Sign')}
                  control={
                    <Checkbox
                      checked={Boolean(field.value)}
                      onChange={(_, checked) => field.onChange(checked)}
                      disabled={isDisabled}
                    />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={12}>
            <Controller
              name='description'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  multiline
                  minRows={4}
                  label={t('Description')}
                  placeholder={t('Description')}
                  {...field}
                  disabled={isDisabled}
                  error={Boolean(errors.description)}
                  helperText={(errors.description as any)?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        {!disable && (
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

export default DocumentTypesGeneralTab
