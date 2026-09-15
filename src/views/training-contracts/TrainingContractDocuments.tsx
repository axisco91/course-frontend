import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useTranslation } from 'react-i18next'
import LoadingDialog from 'src/views/components/LoadingDialog'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'

// ✅ API (ajusta nombres si en tu api.ts se llaman distinto)
import {
  editTrainingContractDocumentFields,
  getContractDocuments,
  getDocumentStudent,
  getTrainingContract,
  sendDocument
} from 'src/api/api'

// ✅ auth/error
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

// ✅ redux
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

type Props = {
  open: boolean
  trainingContractId?: number | null // por si lo quieres pasar por props
}

type DocRow = {
  id: number | string
  name?: string
  date_signed?: string | null
  blade?: string
  [k: string]: any
}

const ymdToDMY = (value?: any) => {
  if (!value) return ''

  // si viene "YYYY-MM-DD..." lo recorto
  const s = String(value).slice(0, 10)

  // simple format DD/MM/YYYY
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return s

  return `${d}/${m}/${y}`
}

const TrainingContractDocuments = ({ open, trainingContractId: trainingContractIdProp }: Props) => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  // ✅ según tu store: a veces lo guardas en trainingContract.id, otras en selectedTrainingContract.id
  const directContractId = useSelector((s: RootState) => (s as any).trainingContract?.id) as number | null
  const selectedContractId = useSelector(
    (s: RootState) => (s as any).trainingContract?.selectedTrainingContract?.id
  ) as number | null
  const tcIdFromStore = directContractId ?? selectedContractId ?? null

  const trainingContractId = trainingContractIdProp ?? tcIdFromStore

  const filterButtonClickCount = useSelector((s: RootState) => (s as any).general?.filterButtonClickCount) as number

  const userPermissions = useSelector((s: RootState) => (s as any).auth?.permissions) as string[]
  const canSend = Array.isArray(userPermissions) && userPermissions.includes('edit.training_contracts') // ajusta permiso si tienes uno específico
  const canView = Array.isArray(userPermissions) && userPermissions.includes('read.training_contracts')

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<DocRow[]>([])
  const [total, setTotal] = useState(0)
  const [contractDocument, setContractDocument] = useState<DocRow | null>(null)
  const [contractFields, setContractFields] = useState({
    remuneration: '',
    remunerationPeriod: '',
    annualHolidays: ''
  })

  // si tu endpoint no pagina, dejamos “client mode” y listo
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }])

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const fetchDocuments = useCallback(async () => {
    if (!open || !trainingContractId) return

    setLoading(true)
    try {
      const res = await getContractDocuments({ training_contract_id: trainingContractId })

      // ✅ tu API vieja devuelve array directo: response.data
      // por si en algún punto lo envuelves:
      const list = res?.data?.data?.document_students ?? res?.data?.documents ?? res?.data?.data ?? res?.data ?? []

      const safe = Array.isArray(list) ? list : []

      // ✅ Asegurar id para DataGrid
      const normalized: DocRow[] = safe.map((d: any, idx: number) => ({
        id: d?.id ?? `tmp-${idx}`,
        ...d
      }))

      setRows(normalized)
      setTotal(normalized.length)
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [open, trainingContractId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments, filterButtonClickCount])

  const handleSendDocument = useCallback(
    async (docId: number) => {
      if (!trainingContractId) return

      const ok = window.confirm('¿Estás seguro? Vas a enviar el documento.')
      if (!ok) return

      setLoading(true)
      try {
        const res = await sendDocument({
          document_id: docId,
          training_contract_id: trainingContractId
        })

        if (res?.data?.status === 200) {
          toast.success('Correo enviado!')

          // si quieres refrescar firmado etc:
          fetchDocuments()
        } else {
          toast.error(res?.data?.message ?? 'Error enviando documento')
        }
      } catch (e) {
        handleErrorRef.current(e, logoutRef.current)
      } finally {
        setLoading(false)
      }
    },
    [trainingContractId, fetchDocuments]
  )

  const generateDocument = useCallback(
    async (row: any, fields?: typeof contractFields) => {
      if (!trainingContractId) return

      const toastId = toast.loading('Generando documento...')
      try {
        const viewName = row?.blade
        if (!viewName) {
          toast.error('El documento no tiene blade')
          toast.dismiss(toastId)

          return
        }

        const res = await getDocumentStudent(
          viewName,
          trainingContractId,
          fields
            ? {
                remuneration: fields.remuneration,
                remuneration_period: fields.remunerationPeriod,
                annual_holidays: fields.annualHolidays
              }
            : undefined
        )

        // 🔎 Detectar si NO es PDF (por ejemplo JSON/HTML de error)
        const ct = res?.headers?.['content-type']
        if (!ct?.includes('pdf')) {
          // res.data es blob igual, lo convertimos a texto para ver el error real
          const text = await new Response(res.data).text()
          console.log('⚠️ NO ES PDF. RESPUESTA:', text)
          toast.error('El servidor no devolvió un PDF (mira consola).')
          toast.dismiss(toastId)

          return
        }

        const blob = new Blob([res.data], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        toast.dismiss(toastId)
      } catch (e) {
        console.log(e)
        toast.error('Error generando documento')
        toast.dismiss(toastId)
      }
    },
    [trainingContractId]
  )

  const handleOpenDocument = useCallback(
    async (row: DocRow) => {
      const viewName = String(row?.blade ?? '')
      if (viewName.includes('ContratoFormacion') || viewName.includes('contratoFormacionAlternancia')) {
        if (!trainingContractId) return

        setLoading(true)
        try {
          const response = await getTrainingContract(trainingContractId)
          const contract =
            response?.data?.data?.training_contract ?? response?.data?.data?.trainingContract ?? response?.data?.data ?? null
          const fields = {
            remuneration: String(contract?.remuneration ?? ''),
            remunerationPeriod: String(contract?.remuneration_period ?? ''),
            annualHolidays: String(contract?.annual_holidays ?? '')
          }

          if (fields.remuneration.trim() && fields.remunerationPeriod.trim() && fields.annualHolidays.trim()) {
            generateDocument(row)
          } else {
            setContractFields(fields)
            setContractDocument(row)
          }
        } catch (e) {
          handleErrorRef.current(e, logoutRef.current)
        } finally {
          setLoading(false)
        }

        return
      }

      generateDocument(row)
    },
    [generateDocument, trainingContractId]
  )

  const closeContractFields = () => setContractDocument(null)

  const confirmContractFields = async () => {
    if (!contractDocument) return
    if (!contractFields.remuneration.trim() || !contractFields.remunerationPeriod.trim() || !contractFields.annualHolidays.trim()) {
      toast.error('Completa los tres campos')

      return
    }

    if (!trainingContractId) return

    setLoading(true)
    try {
      await editTrainingContractDocumentFields(trainingContractId, {
        remuneration: contractFields.remuneration.trim(),
        remuneration_period: contractFields.remunerationPeriod.trim(),
        annual_holidays: contractFields.annualHolidays.trim()
      })
      const row = contractDocument
      setContractDocument(null)
      await generateDocument(row)
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }

  const columns = useMemo(() => {
    return [
      {
        flex: 0.5,
        minWidth: 260,
        field: 'name',
        headerName: t('Name'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 700 }}>
            {params.row?.name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.2,
        minWidth: 140,
        field: 'date_signed',
        headerName: t('Signed'),
        headerAlign: 'center',
        align: 'center',
        sortable: true,
        renderCell: (params: GridRenderCellParams) => {
          const signed = Boolean(params.row?.date_signed)

          return signed ? (
            <Chip label={ymdToDMY(params.row?.date_signed)} color='success' size='small' sx={{ fontWeight: 800 }} />
          ) : (
            <Chip label={t('No')} color='error' size='small' sx={{ fontWeight: 800, minWidth: 60 }} />
          )
        }
      },
      {
        flex: 0.18,
        minWidth: 140,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as any

          return (
            <Fragment>
              {canSend && (
                <Tooltip title={t('Send')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      const id = Number(row?.id)
                      if (!id) return
                      handleSendDocument(id)
                    }}
                  >
                    <Icon icon='tabler:send' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}

              {(canView || true) && (
                <Tooltip title={t('View')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      handleOpenDocument(row)
                    }}
                  >
                    <Icon icon='tabler:eye' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}
            </Fragment>
          )
        }
      }
    ]
  }, [t, canSend, canView, handleSendDocument, handleOpenDocument])

  // ✅ Si tu endpoint NO pagina, lo dejamos client-side.
  // Para que la UI se vea como la captura: 10 por página + paginación abajo.
  const pagedRows = useMemo(() => {
    const base = Array.isArray(rows) ? rows : []
    const start = paginationModel.page * paginationModel.pageSize
    const end = start + paginationModel.pageSize

    // sorting simple client (si quieres server, se cambia como en CoursesStudentsTable)
    const sm = sortModel?.[0]
    const field = sm?.field
    const dir = sm?.sort ?? 'asc'
    const sorted = !field
      ? base
      : [...base].sort((a: any, b: any) => {
          const av = a?.[field]
          const bv = b?.[field]
          if (av == null && bv == null) return 0
          if (av == null) return 1
          if (bv == null) return -1
          if (String(av) < String(bv)) return dir === 'asc' ? -1 : 1
          if (String(av) > String(bv)) return dir === 'asc' ? 1 : -1

          return 0
        })

    return sorted.slice(end > 0 ? start : 0, end)
  }, [rows, paginationModel, sortModel])

  return (
    <Fragment>
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant='h6' sx={{ fontWeight: 800 }}>
            {t('Documents')}
          </Typography>
        </Box>

        <Box sx={{ height: 520, width: '100%' }}>
          <DataGrid
            disableRowSelectionOnClick
            rows={pagedRows}
            columns={columns as any}
            rowCount={total}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={model => setPaginationModel(model)}
            sortModel={sortModel}
            onSortModelChange={model => {
              const next = model?.length ? model : [{ field: 'name', sort: 'asc' }]
              setSortModel(next)
            }}
            getRowId={row => row.id}
          />
        </Box>
      </CardContent>

      {loading && <LoadingDialog />}
    </Card>

    <Dialog open={Boolean(contractDocument)} onClose={closeContractFields} fullWidth maxWidth='sm'>
      <DialogTitle>Datos del contrato de formación en alternancia</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          required
          margin='normal'
          label='Retribución (15)'
          value={contractFields.remuneration}
          onChange={e => setContractFields(current => ({ ...current, remuneration: e.target.value }))}
        />
        <TextField
          fullWidth
          required
          margin='normal'
          label='Periodicidad de la retribución (16)'
          placeholder='Ej.: mensuales'
          value={contractFields.remunerationPeriod}
          onChange={e => setContractFields(current => ({ ...current, remunerationPeriod: e.target.value }))}
        />
        <TextField
          fullWidth
          required
          margin='normal'
          label='Duración de las vacaciones anuales (17)'
          placeholder='Ej.: 30 días naturales'
          value={contractFields.annualHolidays}
          onChange={e => setContractFields(current => ({ ...current, annualHolidays: e.target.value }))}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeContractFields}>Cancelar</Button>
        <Button variant='contained' onClick={confirmContractFields}>Generar documento</Button>
      </DialogActions>
    </Dialog>
    </Fragment>
  )
}

export default TrainingContractDocuments
