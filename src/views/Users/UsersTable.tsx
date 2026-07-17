// src/views/users/UsersTable.tsx
import { useCallback, useContext, useEffect, useMemo, useRef, useState, Fragment } from 'react'

// ** MUI
import { Box, Card, CardContent, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'

// ** Core
import Icon from 'src/@core/components/icon'
import LoadingDialog from 'src/views/components/LoadingDialog'

// ** Redux
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
// ** Hooks / Context
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

// 🔧 Ajusta al nombre real de tu reducer de users
import { userActions } from 'src/reducers/users/UserReducer'

// 🔧 Ajusta al endpoint real
import { getUsers } from 'src/api/api'

type SortType = 'asc' | 'desc' | undefined | null

const UsersTable = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ✅ refs (patrón estable)
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const filterButtonClickCount = useSelector((s: RootState) => s.general.filterButtonClickCount)
  const userPermissions = useSelector((s: RootState) => s.auth.permissions) as string[]

  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.users')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.users')

  // si tienes filtros en redux como en students
  const appliedFilters = useSelector((s: RootState) => (s as any).user?.appliedFilters ?? {})

  // ✅ evita warning aria-hidden (quita foco del DataGrid antes de abrir Dialog)
  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  // ===== table state =====
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sort, setSort] = useState<SortType>('asc')
  const [sortColumn, setSortColumn] = useState<string>('name')

  // ===== fetch =====
  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getUsers({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      // 🔧 Ajusta a tu payload real
      const list = res.data?.data?.users ?? res.data?.data?.data ?? res.data?.data ?? []
      const tot = res.data?.data?.meta?.total ?? res.data?.meta?.total ?? 0

      setRows(Array.isArray(list) ? list : [])
      setTotal(Number(tot) || 0)
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, sort, sortColumn, appliedFilters])

  useEffect(() => {
    fetchRows()
  }, [fetchRows, filterButtonClickCount])

  const handleSortModel = (model: GridSortModel) => {
    if (!model.length) {
      setSort('asc')
      setSortColumn('name')

      return
    }
    setSort(model[0].sort ?? 'asc')
    setSortColumn(model[0].field)
  }

  // ===== columns (SIN menu ⋮, acciones visibles) =====
  const columns = useMemo(
    () => [
      {
        flex: 0.22,
        minWidth: 200,
        field: 'name',
        headerName: 'NOMBRE',
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 700, color: 'text.primary' }}>
            {p.row?.name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.22,
        minWidth: 220,
        field: 'surname',
        headerName: 'APELLIDOS',
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
            {p.row?.surname ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.28,
        minWidth: 260,
        field: 'email',
        headerName: 'CORREO',
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
            {p.row?.email ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.16,
        minWidth: 140,
        field: 'active',
        headerName: 'ESTADO',
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => {
          const isActive = Number(p.row?.active) === 1

          return (
            <Chip
              label={isActive ? 'Activo' : 'Inactivo'}
              color={isActive ? 'success' : 'error'}
              variant='filled'
              size='small'
              sx={{ fontWeight: 700, minWidth: 90 }}
            />
          )
        }
      },
      {
        flex: 0.12,
        minWidth: 120,
        field: 'actions',
        headerName: 'ACCIONES',
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (p: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%' }}>
            {/* EDITAR */}
            {canUpdate && (
              <Tooltip title='Editar' placement='top'>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    blurActiveElement()
                    dispatch(userActions.openModal({ mode: 'edit', userId: p.row.id }))
                    dispatch(userActions.setId(p.row.id))
                  }}
                >
                  <Icon icon='tabler:pencil' fontSize={20} />
                </IconButton>
              </Tooltip>
            )}

            {/* ELIMINAR */}
            {canEliminate && (
              <Tooltip title='Eliminar' placement='top'>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    blurActiveElement()
                    dispatch(userActions.setId(p.row.id))
                    dispatch(userActions.setShowEliminateDialog(true))
                  }}
                >
                  <Icon icon='tabler:trash' fontSize={20} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      }
    ],
    [dispatch, canUpdate, canEliminate]
  )

  return (
    <Fragment>
      <Card>
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              autoHeight
              disableColumnFilter
              disableRowSelectionOnClick
              rows={rows}
              rowCount={total}
              columns={columns as any}
              loading={loading}
              sortingMode='server'
              sortingOrder={['asc', 'desc']}
              sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
              onSortModelChange={handleSortModel}
              paginationMode='server'
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              getRowId={row => row.id}
            />
          </Box>
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default UsersTable
