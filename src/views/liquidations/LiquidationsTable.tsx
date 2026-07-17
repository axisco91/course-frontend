// ** React Imports
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

// ✅ API (cámbialo a tu export real)
import { getLiquidations } from 'src/api/api'

// ✅ Redux (cámbialo a tu reducer real)
import { liquidationActions } from 'src/reducers/liquidations/LiquidationReducer'
type SortType = 'asc' | 'desc' | undefined | null

const LiquidationsTable = () => {
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

  const LIQUIDATION_STATUS_MAP: Record<number, { label: string; color: 'warning' | 'info' | 'primary' | 'success' }> = {
    1: { label: 'PENDIENTE', color: 'warning' },
    2: { label: 'ENVIADA', color: 'info' },
    3: { label: 'RECIBIDA', color: 'primary' },
    4: { label: 'PAGADA', color: 'success' }
  }

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)

  // ✅ permisos (ajusta strings a los tuyos)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.liquidations')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminar.liquidations')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const formatDateDMY = (value?: string | null) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()

    return `${day}-${month}-${year}`
  }

  /**
   * ✅ Columnas según captura:
   * COMMISSIONISTA | CURSO | FECHA INICIO | FECHA FIN | ESTADO | ACCIONES
   *
   * Espera estos campos en cada row (puedes adaptar):
   * - id
   * - commissionist_name (o commissionist?.name)
   * - course_label (o course?.label / course?.name)
   * - beginning (dd/mm/yyyy)
   * - end (dd/mm/yyyy)
   * - status (string o number)
   */
  const columns = useMemo(
    () => [
      {
        flex: 0.26,
        minWidth: 360,
        field: 'advisor',
        headerName: t('Commissionist'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const name = params.row?.advisor.name ?? ''

          return (
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
              {name}
            </Typography>
          )
        }
      },
      {
        flex: 0.34,
        minWidth: 420,
        field: 'course',
        headerName: t('Course'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const course = params.row?.course?.name ?? ''

          return (
            <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
              {course}
            </Typography>
          )
        }
      },
      {
        flex: 0.14,
        minWidth: 160,
        field: 'beginning',
        headerName: t('Start date'),
        headerAlign: 'center',
        align: 'center',
        renderCell: params => (
          <Typography variant='body2'>{formatDateDMY(params.row?.beginning ?? params.row?.start_date)}</Typography>
        )
      },
      {
        flex: 0.14,
        minWidth: 160,
        field: 'end',
        headerName: t('End date'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{formatDateDMY(params.row?.end ?? params.row?.end_date)}</Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 160,
        field: 'status',
        headerName: t('Status'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const statusId = Number(params.row?.status)

          const conf = LIQUIDATION_STATUS_MAP[statusId] ?? {
            label: params.row?.status_name ?? '',
            color: 'secondary' as const
          }

          return (
            <Chip
              label={conf.label}
              color={conf.color}
              size='small'
              variant='filled'
              sx={{ fontWeight: 600, minWidth: 110 }}
            />
          )
        }
      },
      {
        flex: 0.08,
        minWidth: 90,
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
                      dispatch(liquidationActions.setId(Number(id)))
                      dispatch(liquidationActions.openModal({ mode: 'edit', liquidationId: Number(id) }))
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
                      dispatch(liquidationActions.setId(Number(id)))
                      dispatch(liquidationActions.setShowEliminateDialog(true))
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
  const [sort, setSort] = useState<SortType>('desc')
  const [rows, setRows] = useState<any[]>([])
  const [sortColumn, setSortColumn] = useState<string>('beginning') // ✅ default para liquidaciones
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState<boolean>(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getLiquidations({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.liquidations ?? res.data?.data?.data ?? [])
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, sort, sortColumn])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData, filterButtonClickCount])

  const handleSortModel = (model: GridSortModel) => {
    if (!model.length) {
      setSort('desc')
      setSortColumn('beginning')

      return
    }

    setSort(model[0].sort ?? 'desc')
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
                dispatch(liquidationActions.setId(Number(id)))
                dispatch(liquidationActions.openModal({ mode: 'view', liquidationId: Number(id) }))
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
              pageSizeOptions={[10, 25, 50, 100]}
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

export default LiquidationsTable
