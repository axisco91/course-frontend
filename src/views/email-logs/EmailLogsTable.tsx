import { Fragment, useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { getEmailLogs, resendEmailLog } from 'src/api/api'
import format from 'date-fns/format'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import EmailTemplatesDialog from './EmailTemplatesDialog'

type SortType = 'asc' | 'desc' | undefined | null

const EmailLogsTable = () => {
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<SortType>('desc')
  const [sortColumn, setSortColumn] = useState('created_at')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [mailTypeFilter, setMailTypeFilter] = useState('')
  const [resendingId, setResendingId] = useState<number | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)

  const columns: GridColDef[] = [
    {
      flex: 0.9,
      minWidth: 160,
      field: 'created_at',
      headerName: 'Fecha',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <CenteredCell value={params.row.created_at ? format(new Date(params.row.created_at), 'dd/MM/yyyy HH:mm') : ''} />
      )
    },
    {
      flex: 0.7,
      minWidth: 140,
      field: 'mail_type',
      headerName: 'Tipo',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => <CenteredCell value={params.row.mail_type ?? ''} />
    },
    {
      flex: 1,
      minWidth: 220,
      field: 'subject',
      headerName: 'Asunto',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => <CenteredCell value={params.row.subject ?? ''} />
    },
    {
      flex: 1,
      minWidth: 220,
      field: 'original_to',
      headerName: 'Destinatario original',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => <CenteredCell value={params.row.original_to ?? ''} />
    },
    {
      flex: 1,
      minWidth: 220,
      field: 'final_to',
      headerName: 'Destinatario final',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => <CenteredCell value={params.row.final_to ?? ''} />
    },
    {
      flex: 0.6,
      minWidth: 120,
      field: 'status',
      headerName: 'Estado',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => <CenteredCell value={params.row.status ?? ''} />
    },
    {
      flex: 0.9,
      minWidth: 180,
      field: 'student',
      headerName: 'Alumno',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const student = params.row.student
        const value = student ? `${student.name ?? ''} ${student.surname ?? ''}`.trim() : ''

        return <CenteredCell value={value} />
      }
    },
    {
      flex: 1,
      minWidth: 220,
      field: 'course',
      headerName: 'Curso',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const course = params.row.course
        const value = course ? `${course.name ?? ''}${course.group ? ` (${course.group})` : ''}` : ''

        return <CenteredCell value={value} />
      }
    },
    {
      flex: 1.2,
      minWidth: 260,
      field: 'error_message',
      headerName: 'Error',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <CenteredCell value={params.row.error_message ?? ''} />
    },
    {
      flex: 0.4,
      minWidth: 100,
      field: 'actions',
      headerName: 'Acciones',
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title='Reenviar correo'>
          <span>
            <IconButton
              size='small'
              disabled={resendingId === Number(params.row.id) || !params.row.tracing_id}
              onClick={event => {
                event.stopPropagation()
                handleResend(Number(params.row.id))
              }}
            >
              <Icon icon='tabler:send' fontSize={20} />
            </IconButton>
          </span>
        </Tooltip>
      )
    }
  ]

  const fetchTableData = useCallback(async () => {
    const current = paginationModel.page + 1
    const sortTable = sort === 'asc' ? sortColumn : `-${sortColumn}`
    const data = {
      perPage: paginationModel.pageSize,
      page: current,
      sort: sortTable,
      search_text: searchValue,
      status: statusFilter,
      mail_type: mailTypeFilter
    }

    const res = await getEmailLogs(data)
    setTotal(res.data.data.meta.total)
    setRows(res.data.data.email_logs ?? [])
  }, [paginationModel, sort, sortColumn, searchValue, statusFilter, mailTypeFilter])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  async function handleResend(id: number) {
    if (!window.confirm('Se enviará una nueva copia de este correo. ¿Continuar?')) return

    setResendingId(id)
    try {
      const response = await resendEmailLog(id)
      toast.success(response.data?.message ?? 'Correo reenviado correctamente')
      await fetchTableData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'No se ha podido reenviar el correo')
    } finally {
      setResendingId(null)
    }
  }

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length === 0) return
    setSort(newModel[0].sort)
    setSortColumn(newModel[0].field)
  }

  return (
    <Fragment>
      <Card>
        <CardContent>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant='contained'
              startIcon={<Icon icon='tabler:template' />}
              onClick={() => setTemplatesOpen(true)}
            >
              Plantillas
            </Button>
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Buscar'
                value={searchValue}
                onChange={event => {
                  setPaginationModel(prev => ({ ...prev, page: 0 }))
                  setSearchValue(event.target.value)
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id='email-log-status-label'>Estado</InputLabel>
                <Select
                  labelId='email-log-status-label'
                  value={statusFilter}
                  label='Estado'
                  onChange={event => {
                    setPaginationModel(prev => ({ ...prev, page: 0 }))
                    setStatusFilter(event.target.value)
                  }}
                >
                  <MenuItem value=''>Todos</MenuItem>
                  <MenuItem value='sent'>Enviado</MenuItem>
                  <MenuItem value='failed'>Fallido</MenuItem>
                  <MenuItem value='simulated'>Simulado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Tipo de correo'
                value={mailTypeFilter}
                onChange={event => {
                  setPaginationModel(prev => ({ ...prev, page: 0 }))
                  setMailTypeFilter(event.target.value)
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardContent>
          <DataGrid
            disableColumnFilter
            autoHeight
            pagination
            rows={rows}
            rowCount={total}
            columns={columns}
            sortingMode='server'
            sortModel={[{ field: sortColumn, sort: sort ?? 'desc' }]}
            paginationMode='server'
            pageSizeOptions={[25, 50, 100]}
            paginationModel={paginationModel}
            onSortModelChange={handleSortModel}
            onPaginationModelChange={setPaginationModel}
          />
        </CardContent>
      </Card>
      <EmailTemplatesDialog open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
    </Fragment>
  )
}

const CenteredCell = ({ value }: { value: string }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%'
    }}
  >
    <Typography variant='body2' sx={{ color: 'text.primary', textAlign: 'center' }}>
      {value}
    </Typography>
  </Box>
)

export default EmailLogsTable
