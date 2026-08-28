import { useContext, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material'
import toast from 'react-hot-toast'
import CustomTextField from 'src/@core/components/mui/text-field'
import { AuthContext } from 'src/context/AuthContext'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { getTrainingContractCommunicationPreview, sendTrainingContractCommunication } from 'src/api/api'

export type TrainingContractCommunicationType = 'guide' | 'compliance' | 'noncompliance'

type Props = {
  open: boolean
  trainingContractId: number | null
  type: TrainingContractCommunicationType | null
  onClose: () => void
  onSent: () => void
}

type Preview = {
  type: TrainingContractCommunicationType
  subject: string
  body_html: string
  course: { id: number; name: string }
  logical_recipients: Array<{ channel: string; recipient: string }>
  final_recipient: string | null
  attachment_name: string | null
  moodle_redirected_to_smtp: boolean
  company_message: { subject: string; body_html: string }
  student_message: { subject: string; body_html: string } | null
}

const titles: Record<TrainingContractCommunicationType, string> = {
  guide: 'Mandar guía tutor',
  compliance: 'Mandar cumplimiento',
  noncompliance: 'Mandar incumplimiento'
}

const createConfirmationToken = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8

    return value.toString(16)
  })
}

const TrainingContractCommunicationDialog = ({ open, trainingContractId, type, onClose, onSent }: Props) => {
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const studentEditorRef = useRef<HTMLDivElement | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [subject, setSubject] = useState('')
  const [studentSubject, setStudentSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const confirmationTokenRef = useRef<string>('')

  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  useEffect(() => {
    if (!open || !trainingContractId || !type) return

    let active = true
    setLoading(true)
    setLoadError(false)
    setPreview(null)
    confirmationTokenRef.current = createConfirmationToken()

    getTrainingContractCommunicationPreview(trainingContractId, type)
      .then(response => {
        if (!active) return
        const data = response.data?.data as Preview
        setPreview(data)
        setSubject(data.company_message?.subject ?? data.subject)
        setStudentSubject(data.student_message?.subject ?? '')
      })
      .catch(error => {
        if (!active) return
        setLoadError(true)
        handleErrorRef.current(error, logoutRef.current)
      })
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [open, trainingContractId, type])

  const send = async () => {
    if (!trainingContractId || !type || !preview || !subject.trim()) return

    setSending(true)
    try {
      await sendTrainingContractCommunication(trainingContractId, type, {
        confirmation_token: confirmationTokenRef.current,
        subject: subject.trim(),
        body_html: editorRef.current?.innerHTML ?? preview.company_message?.body_html ?? preview.body_html,
        student_subject: preview.student_message ? studentSubject.trim() : null,
        student_body_html: preview.student_message
          ? studentEditorRef.current?.innerHTML ?? preview.student_message.body_html
          : null
      })
      toast.success('Correo enviado con éxito')
      onSent()
      onClose()
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !sending && onClose()} fullWidth maxWidth='md'>
      <DialogTitle>{type ? titles[type] : 'Revisar comunicación'}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : preview ? (
          <Box sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <Chip label={`Curso activo: ${preview.course.name}`} color='primary' variant='outlined' />
              {preview.attachment_name ? <Chip label={`Adjunto: ${preview.attachment_name}`} variant='outlined' /> : null}
            </Stack>

            <Typography variant='subtitle2' sx={{ mb: 1 }}>Destinatarios lógicos</Typography>
            {preview.logical_recipients.map(recipient => (
              <Typography key={`${recipient.channel}-${recipient.recipient}`} variant='body2'>
                {recipient.channel}: {recipient.recipient || 'Sin configurar'}
              </Typography>
            ))}

            {preview.final_recipient ? (
              <Alert severity='warning' sx={{ my: 3 }}>
                Modo prueba: todos los envíos se entregarán a {preview.final_recipient}.
              </Alert>
            ) : null}

            <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 600 }}>
              Correo para la empresa y el tutor laboral
            </Typography>
            <CustomTextField
              fullWidth
              label='Asunto'
              value={subject}
              onChange={event => setSubject(event.target.value)}
              sx={{ mb: 4 }}
            />
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>Mensaje editable</Typography>
            <Box
              key={`${preview.type}-${preview.subject}`}
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: preview.company_message?.body_html ?? preview.body_html }}
              sx={{
                minHeight: 360,
                p: 3,
                border: theme => `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                bgcolor: 'background.paper',
                outline: 'none',
                '&:focus': { borderColor: 'primary.main' }
              }}
            />

            {preview.student_message ? (
              <Box sx={{ mt: 5 }}>
                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 600 }}>
                  Mensaje para el alumno
                </Typography>
                <CustomTextField
                  fullWidth
                  label='Asunto para el alumno'
                  value={studentSubject}
                  onChange={event => setStudentSubject(event.target.value)}
                  sx={{ mb: 4 }}
                />
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>Mensaje editable</Typography>
                <Box
                  key={`student-${preview.type}-${preview.student_message.subject}`}
                  ref={studentEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: preview.student_message.body_html }}
                  sx={{
                    minHeight: 300,
                    p: 3,
                    border: theme => `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    outline: 'none',
                    '&:focus': { borderColor: 'primary.main' }
                  }}
                />
              </Box>
            ) : null}
          </Box>
        ) : loadError ? <Alert severity='error'>No se puede preparar esta comunicación.</Alert> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>Cancelar</Button>
        <Button
          variant='contained'
          onClick={send}
          disabled={loading || sending || !preview || !subject.trim() || Boolean(preview?.student_message && !studentSubject.trim())}
          startIcon={sending ? <CircularProgress size={18} /> : undefined}
        >
          {sending ? 'Enviando...' : 'Confirmar y enviar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TrainingContractCommunicationDialog
