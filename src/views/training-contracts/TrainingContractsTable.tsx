import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useTranslation } from 'react-i18next'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'

// ✅ CAMBIA ESTO por tu endpoint real
// Ej: getTrainingActionContracts(trainingActionId, params)
// o getTrainingContracts(params)
import { getTrainingContracts } from 'src/api/api'

// ✅ redux
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// Si tienes un reducer/modal de contracts, cámbialo aquí
// import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'

type SortType = 'asc' | 'desc' | undefined | null

const TrainingContractsTable = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // 🔒 refs para evitar deps inestables
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const appliedFilters = useSelector((state: RootState) => state.trainingContract.appliedFilters)

  // ✅ ajusta permisos a los tuyos reales
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.training_contracts')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.training_contracts')
  const rowsPerPageLabel = t('Rows per page')
  const ofLabel = t('of')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const columns = useMemo(() => {
    const cols: any[] = [
      // Number
      {
        flex: 0.12,
        minWidth: 120,
        field: 'number',
        headerName: t('Number'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {params.row?.number ?? params.row?.contract_number ?? params.row?.id ?? ''}
          </Typography>
        )
      },

      // Company
      {
        flex: 0.22,
        minWidth: 220,
        field: 'company',
        headerName: t('Company'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 700 }}>
            {params.row?.company_name ?? params.row?.company?.name ?? params.row?.company ?? ''}
          </Typography>
        )
      },

      // Student name
      {
        flex: 0.24,
        minWidth: 240,
        field: 'student_name',
        headerName: t('Student'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const s = params.row?.student ?? params.row?.worker ?? params.row?.student_data ?? null

          const name = `${s.name ?? ''} ${s.surname ?? ''}`.trim()

          return (
            <Typography noWrap variant='body2'>
              {name}
            </Typography>
          )
        }
      },

      // Status (training_contract_statuses)
      {
        flex: 0.16,
        minWidth: 170,
        field: 'status',
        headerName: t('Status'),
        headerAlign: 'center',
        align: 'center',
        sortable: true,
        renderCell: (params: GridRenderCellParams) => {
          const statusId =
            params.row?.training_contract_status_id ??
            params.row?.training_contract_status?.id ??
            params.row?.status_id ??
            null

          const statusName =
            params.row?.training_contract_status?.name ??
            params.row?.training_contract_status_name ??
            params.row?.status_name ??
            params.row?.status ??
            '-'

          const STATUS_COLOR_MAP: Record<number, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
            1: 'info', // TRAMITACIÓN
            2: 'warning', // IMPARTICIÓN
            3: 'success', // FINALIZADO
            4: 'error', // BAJA
            5: 'error', // BAJA IT
            6: 'default' // NO FORMALIZADO
          }

          const color = STATUS_COLOR_MAP[statusId] ?? 'default'

          return (
            <Chip
              label={statusName}
              color={color}
              size='small'
              sx={{
                fontWeight: 700,
                minWidth: 120,
                textTransform: 'uppercase'
              }}
            />
          )
        }
      },

      // Provider
      {
        flex: 0.18,
        minWidth: 200,
        field: 'provider',
        headerName: t('Provider'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.provider_name ?? params.row?.provider?.name ?? params.row?.provider ?? ''}
          </Typography>
        )
      },

      // Start date
      {
        flex: 0.14,
        minWidth: 140,
        field: 'start_date',
        headerName: t('Start date'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {(params.row?.start_date ?? params.row?.beginning ?? params.row?.start ?? '').toString().slice(0, 10)}
          </Typography>
        )
      },

      // End date
      {
        flex: 0.14,
        minWidth: 140,
        field: 'end_date',
        headerName: t('End date'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {(params.row?.end_date ?? params.row?.end ?? params.row?.finish ?? '').toString().slice(0, 10)}
          </Typography>
        )
      },

      // Actions (AL FINAL)
      {
        flex: 0.12,
        minWidth: 110,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => {
          const id = params.row?.id ?? params.row?.training_contract_id
          if (!id) return null

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, width: '100%' }}>
              {/* View */}
              <Tooltip title={t('View')} placement='top'>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    blurActiveElement()

                    // 👉 aquí abre tu modal de contrato si lo tienes
                    // dispatch(trainingContractActions.setId(Number(id)))
                    // dispatch(trainingContractActions.openModal({ mode: 'view' }))
                  }}
                >
                  <Icon icon='tabler:eye' fontSize={20} />
                </IconButton>
              </Tooltip>

              {canUpdate && (
                <Tooltip title={t('Edit')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()

                      // 👉 aquí abre tu modal de contrato en edit
                      // dispatch(trainingContractActions.setId(Number(id)))
                      // dispatch(trainingContractActions.openModal({ mode: 'edit' }))
                    }}
                  >
                    <Icon icon='tabler:pencil' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}

              {canEliminate && (
                <Tooltip title={t('Delete')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()

                      // 👉 usa el delete dialog global
                      dispatch(trainingContractActions.setId(Number(id)))
                      dispatch(trainingContractActions.setShowEliminateDialog(true))
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
    ]

    return cols
  }, [t, canUpdate, canEliminate, dispatch])

  const paginationLocaleText = useMemo(
    () => ({
      MuiTablePagination: {
        labelRowsPerPage: rowsPerPageLabel === 'Rows per page' ? 'Filas por página:' : `${rowsPerPageLabel}:`,
        labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
          `${from}-${to} ${ofLabel === 'of' ? 'de' : ofLabel} ${count !== -1 ? count : to}`
      }
    }),
    [rowsPerPageLabel, ofLabel]
  )

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<SortType>('desc')
  const [sortColumn, setSortColumn] = useState('number')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getTrainingContracts({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.training_contracts ?? res.data?.data?.data ?? [])
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, sort, sortColumn, appliedFilters])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData, filterButtonClickCount])

  const handleSortModel = (model: GridSortModel) => {
    if (!model.length) {
      setSort('desc')
      setSortColumn('number')

      return
    }

    setSort(model[0].sort ?? 'desc')
    setSortColumn(model[0].field)
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ width: '100%' }}>
          <DataGrid
            autoHeight
            disableRowSelectionOnClick
            disableColumnFilter
            rows={rows}
            columns={columns}
            getRowId={row => row.id}
            rowCount={total}
            loading={loading}
            localeText={paginationLocaleText}
            pagination
            paginationMode='server'
            sortingMode='server'
            sortingOrder={['asc', 'desc']}
            pageSizeOptions={[25, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sx={{
              '& .MuiDataGrid-footerContainer': {
                minHeight: 56
              },
              '& .MuiTablePagination-toolbar': {
                gap: 2,
                flexWrap: 'wrap',
                justifyContent: 'flex-end'
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                m: 0,
                whiteSpace: 'nowrap'
              },
              '& .MuiTablePagination-select': {
                minWidth: '4rem !important',
                pr: 4
              },
              '& .MuiTablePagination-actions': {
                ml: 1
              }
            }}
            sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
            onSortModelChange={handleSortModel}
            onRowClick={params => {
              blurActiveElement()
              dispatch(trainingContractActions.setId(Number(params.row.id)))
              dispatch(trainingContractActions.openModal({ mode: 'view' }))
            }}
          />
        </Box>
      </CardContent>

      {loading && <LoadingDialog />}
    </Card>
  )
}

export default TrainingContractsTable
