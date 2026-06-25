import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, CardContent, Chip, IconButton, Tooltip } from '@mui/material'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { getTrainingUnits } from 'src/api/api'
import { AuthContext } from 'src/context/AuthContext'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { trainingUnitActions } from 'src/reducers/general/TrainingUnitReducer'
import { RootState } from 'src/reducers/types/types'
import LoadingDialog from 'src/views/components/LoadingDialog'

type SortType = 'asc' | 'desc' | undefined | null

const toArray = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (raw && typeof raw === 'object') return Object.values(raw)

  return []
}

const TrainingUnitsTable = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const appliedFilters = useSelector((state: RootState) => state.trainingUnit.appliedFilters)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)

  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.management')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.management')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const columns = useMemo(
    () => [
      {
        flex: 0.2,
        minWidth: 170,
        field: 'formative_unit',
        headerName: 'UNIDAD FORMATIVA',
        headerAlign: 'center',
        align: 'left',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {params.row?.formative_unit ?? params.row?.code ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.4,
        minWidth: 260,
        field: 'name',
        headerName: 'NOMBRE',
        headerAlign: 'center',
        align: 'left',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {params.row?.name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.13,
        minWidth: 120,
        field: 'total_hours',
        headerName: 'HORAS',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.total_hours ?? params.row?.hours ?? 0}</Typography>
        )
      },
      {
        flex: 0.15,
        minWidth: 130,
        field: 'active',
        headerName: 'ESTADO',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const active = Number(params.row?.active ?? params.row?.is_active ?? 0) === 1

          return (
            <Chip
              label={active ? 'Activo' : 'Inactivo'}
              color={active ? 'success' : 'error'}
              variant='filled'
              size='small'
              sx={{ fontWeight: 600, minWidth: 95 }}
            />
          )
        }
      },
      {
        flex: 0.12,
        minWidth: 120,
        field: 'actions',
        headerName: 'ACCIONES',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const id = Number(params.row?.id)
          const name = String(params.row?.name ?? '')

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 1 }}>
              {canUpdate && (
                <Tooltip title='Editar' placement='top'>
                  <span>
                    <IconButton
                      size='small'
                      disabled={!id}
                      onClick={e => {
                        e.stopPropagation()
                        blurActiveElement()
                        dispatch(trainingUnitActions.setId(id))
                        dispatch(trainingUnitActions.setName(name))
                        dispatch(
                          trainingUnitActions.openModal({ mode: 'edit', trainingUnitId: id, trainingUnitName: name })
                        )
                      }}
                    >
                      <Icon icon='tabler:pencil' fontSize={20} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              {canEliminate && (
                <Tooltip title='Eliminar' placement='top'>
                  <span>
                    <IconButton
                      size='small'
                      disabled={!id}
                      onClick={e => {
                        e.stopPropagation()
                        blurActiveElement()
                        dispatch(trainingUnitActions.setId(id))
                        dispatch(trainingUnitActions.setShowEliminateDialog(true))
                      }}
                    >
                      <Icon icon='tabler:trash' fontSize={20} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
          )
        }
      }
    ],
    [canEliminate, canUpdate, dispatch]
  )

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('asc')
  const [sortColumn, setSortColumn] = useState<string>('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [loading, setLoading] = useState<boolean>(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getTrainingUnits({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        code: appliedFilters.code,
        formative_unit: appliedFilters.code,
        name: appliedFilters.name
      })

      const units =
        res.data?.data?.training_units ??
        res.data?.training_units ??
        res.data?.data?.units ??
        res.data?.units ??
        res.data?.data?.data ??
        res.data?.data?.training_unit ??
        res.data?.data ??
        []

      const list = toArray(units)
      const totalRows = Number(res.data?.data?.meta?.total ?? list.length)

      setRows(list)
      setTotal(totalRows)
      dispatch(trainingUnitActions.setTrainingUnits(list))
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters.code, appliedFilters.name, dispatch, paginationModel.page, paginationModel.pageSize, sort, sortColumn])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData, filterButtonClickCount])

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
              disableColumnFilter
              pagination
              autoHeight
              rows={rows}
              rowCount={total}
              columns={columns as any}
              getRowId={row => row.id ?? row.value}
              sortingMode='server'
              sortingOrder={['asc', 'desc']}
              sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
              paginationMode='server'
              pageSizeOptions={[25, 50, 100]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              onRowClick={params => {
                blurActiveElement()
                const id = Number((params.row as any)?.id ?? params.id)
                const name = String((params.row as any)?.name ?? '')

                dispatch(trainingUnitActions.setId(id))
                dispatch(trainingUnitActions.setName(name))
                dispatch(trainingUnitActions.openModal({ mode: 'view', trainingUnitId: id, trainingUnitName: name }))
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default TrainingUnitsTable
