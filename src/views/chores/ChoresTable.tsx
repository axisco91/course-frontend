// ChoresTable.tsx
import { useEffect, useState, useCallback, Fragment, useContext, useMemo, useRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { CardContent, Chip, IconButton, Tooltip } from '@mui/material'

// ** ThirdParty
import { useTranslation } from 'react-i18next'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Icon
import Icon from 'src/@core/components/icon'

// ** Utils
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'

// API
import { getChores } from 'src/api/api'

// Redux
import { choreActions } from 'src/reducers/chores/ChoreReducer'

type SortType = 'asc' | 'desc' | undefined | null

const mapStatusText = (status: any, options: string[]) => {
  const s = Number(status)
  const statusMap: Record<number, string> = {
    0: options[0] ?? 'Pendiente',
    1: options[1] ?? 'Enviado',
    2: options[2] ?? 'Recibido',
    3: options[3] ?? 'No procede'
  }

  return statusMap[s] ?? 'Desconocido'
}

const statusChip = (status: any, options: string[], t: any) => {
  const label = mapStatusText(status, options)

  // colores (ajústalos si quieres)
  const s = Number(status)
  const color = s === 2 ? 'success' : s === 1 ? 'info' : s === 3 ? 'secondary' : /* 0 o unknown */ 'warning'

  return (
    <Chip label={t(label)} color={color as any} variant='filled' size='small' sx={{ fontWeight: 600, minWidth: 120 }} />
  )
}

const courseStatusChip = (status: any, t: any) => {
  const label = String(status ?? '')
    .trim()
    .toUpperCase()

  // Ajusta colores como prefieras
  const color =
    label === 'FINALIZADO'
      ? 'success'
      : label === 'IMPARTICIÓN'
      ? 'info'
      : label === 'ANULADO'
      ? 'error'
      : /* PENDIENTE u otros */ 'warning'

  return (
    <Chip
      label={t(label || 'PENDIENTE')}
      color={color as any}
      variant='filled'
      size='small'
      sx={{ fontWeight: 700, minWidth: 120 }}
    />
  )
}

const ChoresTable = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ✅ refs para no meter funciones inestables en deps
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const appliedFilters = useSelector((state: RootState) => state.chore.appliedFilters)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)

  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.chores')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.chores')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const columns = useMemo(
    () => [
      {
        flex: 0.24,
        minWidth: 360,
        field: 'course',
        headerName: t('Course'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {params.row?.course_name ?? params.row?.course?.name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 240,
        field: 'company',
        headerName: t('Company'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.company_name ?? params.row?.company?.name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 240,
        field: 'student',
        headerName: t('Student'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          return (
            <Typography noWrap variant='body2'>
              {params.row.student.name} {params.row.student.surname}
            </Typography>
          )
        }
      },
      {
        flex: 0.12,
        minWidth: 140,
        field: 'status',
        headerName: t('Status'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => courseStatusChip(params.row?.status, t)
      },

      // Estados (chips)
      {
        flex: 0.16,
        minWidth: 170,
        field: 'membership_tab_status',
        headerName: t('Membership tab'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          statusChip(params.row?.membership_tab_status, ['Pendiente', 'Enviado', 'Recibido', 'No procede'], t)
      },
      {
        flex: 0.16,
        minWidth: 190,
        field: 'economic_proposal_status',
        headerName: t('Economic proposal'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          statusChip(params.row?.economic_proposal_status, ['Pendiente', 'Enviado', 'Recibido'], t)
      },
      {
        flex: 0.16,
        minWidth: 170,
        field: 'student_tab_status',
        headerName: t('Student tab'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          statusChip(params.row?.student_tab_status, ['Pendiente', 'Enviado', 'Recibido'], t)
      },
      {
        flex: 0.16,
        minWidth: 180,
        field: 'welcome_guid_status',
        headerName: t('Welcome guide'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          statusChip(params.row?.welcome_guid_status, ['Pendiente', 'Enviado', 'Recibido'], t)
      },
      {
        flex: 0.16,
        minWidth: 170,
        field: 'registration_status',
        headerName: t('Registration'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          statusChip(params.row?.registration_status, ['Pendiente', 'Realizada'], t)
      },
      {
        flex: 0.16,
        minWidth: 160,
        field: 'diploma_status',
        headerName: t('Diploma'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          statusChip(params.row?.diploma_status, ['Pendiente', 'Enviada', 'No procede'], t)
      },
      {
        flex: 0.18,
        minWidth: 210,
        field: 'start_communication_status',
        headerName: t('Start communication'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          statusChip(params.row?.start_communication_status, ['Pendiente', 'Realizada', 'No procede'], t)
      },
      {
        flex: 0.18,
        minWidth: 210,
        field: 'close_communication_status',
        headerName: t('Close communication'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          statusChip(params.row?.close_communication_status, ['Pendiente', 'Realizada', 'No procede'], t)
      },
      {
        flex: 0.14,
        minWidth: 150,
        field: 'invoiced_status',
        headerName: t('Invoiced'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          statusChip(params.row?.invoiced_status, ['Pendiente', 'Realizada', 'No procede'], t)
      },
      {
        flex: 0.18,
        minWidth: 210,
        field: 'bonus_sent_status',
        headerName: t('Bonus sent'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          statusChip(params.row?.bonus_sent_status, ['Pendiente', 'Realizada', 'No procede'], t)
      },

      // Acciones
      {
        flex: 0.12,
        minWidth: 100,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const id = params.row?.id ?? params.row?.value

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 1 }}>
              {canUpdate && (
                <Tooltip title={t('Edit')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(choreActions.setId(Number(id)))
                      dispatch(choreActions.openModal({ mode: 'edit' }))
                    }}
                  >
                    <Icon icon='tabler:pencil' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}

              {canEliminate && (
                <Tooltip title={t('Eliminate')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(choreActions.setId(Number(id)))
                      dispatch(choreActions.setShowEliminateDialog(true))
                    }}
                  >
                    <Icon icon='tabler:trash' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }
      }
    ],
    [t, canUpdate, canEliminate, dispatch]
  )

  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('asc')
  const [rows, setRows] = useState<any[]>([])
  const [sortColumn, setSortColumn] = useState<string>('course')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [loading, setLoading] = useState<boolean>(false)
  const skipFetchUntilPageResetRef = useRef(false)
  const lastFilterButtonClickCountRef = useRef(filterButtonClickCount)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getChores({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.chores ?? res.data?.data?.data ?? [])
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, sort, sortColumn, appliedFilters])

  useEffect(() => {
    if (lastFilterButtonClickCountRef.current === filterButtonClickCount) return

    lastFilterButtonClickCountRef.current = filterButtonClickCount

    if (paginationModel.page !== 0) {
      skipFetchUntilPageResetRef.current = true
      setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }))
    }
  }, [filterButtonClickCount, paginationModel.page])

  useEffect(() => {
    if (skipFetchUntilPageResetRef.current && paginationModel.page !== 0) return

    skipFetchUntilPageResetRef.current = false
    fetchTableData()
  }, [fetchTableData, filterButtonClickCount, paginationModel.page])

  const handleSortModel = (model: GridSortModel) => {
    if (!model.length) {
      setSort('asc')
      setSortColumn('name')

      return
    }

    setSort(model[0].sort ?? 'asc')
    setSortColumn(model[0].field)
  }

  return (
    <Fragment>
      <Card>
        <CardContent>
          <Box>
            <DataGrid
              disableRowSelectionOnClick
              getRowId={row => row.id ?? row.value}
              onRowClick={params => {
                blurActiveElement()
                const id = (params.row as any)?.id ?? (params.row as any)?.value ?? params.id
                dispatch(choreActions.setId(Number(id)))
                dispatch(choreActions.openModal({ mode: 'edit' })) // chores: normalmente edit
              }}
              disableColumnFilter
              pagination
              autoHeight
              rows={rows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              sortingOrder={['asc', 'desc']}
              sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
              paginationMode='server'
              pageSizeOptions={[25, 50, 100]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
            />
          </Box>
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default ChoresTable
