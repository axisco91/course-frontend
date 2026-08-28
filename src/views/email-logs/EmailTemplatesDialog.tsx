import { DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography
} from '@mui/material'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import CustomTextField from 'src/@core/components/mui/text-field'
import Icon from 'src/@core/components/icon'
import { getEmailTemplates, getWebPlatforms, resetEmailTemplate, saveEmailTemplate } from 'src/api/api'
import toast from 'react-hot-toast'

type Template = {
  mail_type: string
  name: string
  subject: string
  body_html: string
  variables: string[]
  customized: boolean
  source?: 'platform' | 'company' | 'default'
}

type Platform = { id: number; name: string }

type Props = {
  open: boolean
  onClose: () => void
}

const variableLabels: Record<string, string> = {
  student_name: 'Nombre del alumno',
  formative_action: 'Acción formativa',
  tutor_name: 'Profesor',
  subject_code: 'Código y grupo',
  total_hours: 'Horas totales',
  course_start_date: 'Fecha de inicio',
  course_end_date: 'Fecha de fin',
  milestone_label: 'Porcentaje',
  milestone_date: 'Fecha del seguimiento',
  final_result: 'Resultado final',
  remaining_hours: 'Horas pendientes',
  remaining_units: 'Contenidos pendientes',
  remaining_activities: 'Actividades pendientes',
  progress_message: 'Resumen del progreso',
  company_tutor_name: 'Tutor laboral de la empresa'
}

const previewValues: Record<string, string> = {
  student_name: 'María García López',
  formative_action: '738: Prevención de riesgos laborales',
  tutor_name: 'Ana Martínez',
  subject_code: '738/0001',
  total_hours: '60',
  course_start_date: '15-07-2026',
  course_end_date: '30-09-2026',
  milestone_label: '50 %',
  milestone_date: '20-08-2026',
  final_result: 'APTO',
  remaining_hours: '12',
  remaining_units: '2',
  remaining_activities: '1',
  progress_message: 'Actualmente te quedan 12 horas de conexión, 2 contenidos y 1 actividad por completar.',
  company_tutor_name: 'Ezequiel'
}

const replacePreviewVariables = (value: string) =>
  value.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key) => previewValues[key] ?? `{{${key}}}`)

const EmailTemplatesDialog = ({ open, onClose }: Props) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedType, setSelectedType] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const bodyInputRef = useRef<HTMLTextAreaElement | null>(null)

  const selectedTemplate = useMemo(
    () => templates.find(template => template.mail_type === selectedType) ?? null,
    [templates, selectedType]
  )

  const loadTemplates = async (preferredType?: string) => {
    setLoading(true)
    try {
      const response = await getEmailTemplates(selectedPlatform?.id)
      const list: Template[] = response.data?.data?.email_templates ?? []
      setTemplates(list)
      const nextType = preferredType && list.some(item => item.mail_type === preferredType)
        ? preferredType
        : list[0]?.mail_type ?? ''
      setSelectedType(nextType)
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'No se han podido cargar las plantillas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      getWebPlatforms().then(response => setPlatforms(response.data?.data?.web_platforms ?? []))
      loadTemplates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open) loadTemplates(selectedType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatform?.id])

  useEffect(() => {
    if (!selectedTemplate) return
    setSubject(selectedTemplate.subject)
    setBodyHtml(selectedTemplate.body_html)
  }, [selectedTemplate])

  const insertVariable = (variable: string) => {
    const token = `{{${variable}}}`
    const input = bodyInputRef.current
    const start = input?.selectionStart ?? bodyHtml.length
    const end = input?.selectionEnd ?? start
    const next = `${bodyHtml.slice(0, start)}${token}${bodyHtml.slice(end)}`
    setBodyHtml(next)

    requestAnimationFrame(() => {
      input?.focus()
      input?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const variable = event.dataTransfer.getData('text/email-variable')
    if (variable) insertVariable(variable)
  }

  const handleSave = async () => {
    if (!selectedTemplate) return
    setSaving(true)
    try {
      await saveEmailTemplate(selectedTemplate.mail_type, {
        mail_type: selectedTemplate.mail_type,
        subject,
        body_html: bodyHtml,
        web_platform_id: selectedPlatform?.id ?? null
      })
      toast.success('Plantilla guardada correctamente')
      await loadTemplates(selectedTemplate.mail_type)
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'No se ha podido guardar la plantilla')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!selectedTemplate || !window.confirm('Se restaurará la plantilla original. ¿Continuar?')) return
    setSaving(true)
    try {
      await resetEmailTemplate(selectedTemplate.mail_type, selectedPlatform?.id)
      toast.success('Plantilla original restaurada')
      await loadTemplates(selectedTemplate.mail_type)
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'No se ha podido restaurar la plantilla')
    } finally {
      setSaving(false)
    }
  }

  const previewDocument = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#333;padding:20px;line-height:1.5}p{margin:0 0 12px}</style></head><body>${replacePreviewVariables(bodyHtml)}</body></html>`

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth='lg'>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant='h5'>Plantillas de correo</Typography>
          <Typography variant='body2' color='text.secondary'>Pulsa o arrastra una variable hasta el contenido.</Typography>
        </Box>
        <Button color='secondary' onClick={onClose} disabled={saving}>Cerrar</Button>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ minHeight: 650 }}>
        <Autocomplete
          sx={{ mb: 5, maxWidth: 480 }}
          value={selectedPlatform}
          onChange={(_, value) => setSelectedPlatform(value)}
          options={platforms}
          getOptionLabel={option => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={params => (
            <CustomTextField {...params} label='Ámbito de la plantilla' placeholder='Empresa completa' />
          )}
        />
        <Typography variant='body2' color='text.secondary' sx={{ mt: -3, mb: 4 }}>
          {selectedPlatform ? `Personalización para ${selectedPlatform.name}` : 'Plantillas generales de la empresa'}
        </Typography>
        {loading ? (
          <Box sx={{ minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={5}>
            <Grid item xs={12} md={3}>
              <Typography variant='subtitle1' sx={{ mb: 2 }}>Tipos de correo</Typography>
              <List disablePadding sx={{ border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                {templates.map(template => (
                  <ListItemButton
                    key={template.mail_type}
                    selected={template.mail_type === selectedType}
                    onClick={() => setSelectedType(template.mail_type)}
                  >
                    <ListItemText primary={template.name} />
                    {template.customized && <Chip size='small' color='primary' label={template.source === 'platform' ? 'Moodle' : 'Empresa'} />}
                  </ListItemButton>
                ))}
              </List>
            </Grid>

            <Grid item xs={12} md={9}>
              {selectedTemplate && (
                <Stack spacing={4}>
                  <CustomTextField
                    fullWidth
                    label='Asunto'
                    value={subject}
                    onChange={event => setSubject(event.target.value)}
                  />

                  <Box>
                    <Typography variant='subtitle2' sx={{ mb: 2 }}>Variables disponibles</Typography>
                    <Stack direction='row' gap={2} flexWrap='wrap'>
                      {selectedTemplate.variables.map(variable => (
                        <Chip
                          key={variable}
                          draggable
                          color='primary'
                          variant='outlined'
                          label={variableLabels[variable] ?? variable}
                          onClick={() => insertVariable(variable)}
                          onDragStart={event => event.dataTransfer.setData('text/email-variable', variable)}
                          sx={{ cursor: 'grab' }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Box onDrop={handleDrop} onDragOver={event => event.preventDefault()}>
                    <CustomTextField
                      fullWidth
                      multiline
                      minRows={12}
                      label='Contenido HTML'
                      value={bodyHtml}
                      onChange={event => setBodyHtml(event.target.value)}
                      inputRef={bodyInputRef}
                      helperText='Se permiten párrafos, saltos de línea, negrita, cursiva y listas.'
                    />
                  </Box>

                  <Box>
                    <Typography variant='subtitle2'>Vista previa</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                      Asunto: {replacePreviewVariables(subject)}
                    </Typography>
                    <Box
                      component='iframe'
                      title='Vista previa de la plantilla'
                      sandbox=''
                      srcDoc={previewDocument}
                      sx={{ width: '100%', height: 280, border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}
                    />
                  </Box>
                </Stack>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 6, py: 4 }}>
        <Button
          color='secondary'
          variant='tonal'
          startIcon={<Icon icon='tabler:restore' />}
          onClick={handleReset}
          disabled={saving || !selectedTemplate}
        >
          Restaurar original
        </Button>
        <Button
          variant='contained'
          startIcon={<Icon icon='tabler:device-floppy' />}
          onClick={handleSave}
          disabled={saving || !selectedTemplate || !subject.trim() || !bodyHtml.trim()}
        >
          Guardar plantilla
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EmailTemplatesDialog
