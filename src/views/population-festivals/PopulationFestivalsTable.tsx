import { useEffect, useState, useCallback, Fragment, useContext, useMemo, useRef } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { CardContent, IconButton, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import Icon from 'src/@core/components/icon'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'

import { getPopulationFestivals } from 'src/api/api'
import { populationFestivalActions } from 'src/reducers/trainingContracts/PopulationFestivalReducer'

type SortType = 'asc' | 'desc' | undefined | null

const formatDateDMY = (value?: string | null) => {
  if (!value) return ''
  const v = String(value).slice(0, 10)
  const [y, m, d] = v.split('-')

  return y && m && d ? `${d}-${m}-${y}` : String(value)
}

const PopulationFestivalsTable = () => {
  const { t } = useTranslation()
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
  const appliedFilters = useSelector((state: RootState) => (state as any).populationFestival?.appliedFilters ?? {})

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
        flex: 0.34,
        minWidth: 240,
        field: 'population',
        headerName: t('Population'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {params.row?.population}
          </Typography>
        )
      },
      {
        flex: 0.36,
        minWidth: 260,
        field: 'festival',
        headerName: t('Festival'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
            {params.row?.nacional_festival?.name ??
              params.row?.festival?.name ??
              params.row?.festival_name ??
              params.row?.name ??
              ''}
          </Typography>
        )
      },
      {
        flex: 0.14,
        minWidth: 140,
        field: 'day',
        headerName: t('Day'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {formatDateDMY(params.row?.day ?? params.row?.nacional_festival?.day ?? params.row?.festival?.day)}
          </Typography>
        )
      },
      {
        flex: 0.16,
        minWidth: 130,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const id = Number(params.row?.id)

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 1 }}>
              {canUpdate && (
                <Tooltip title={t('Edit')} placement='top'>
                  <span>
                    <IconButton
                      size='small'
                      disabled={!id}
                      onClick={e => {
                        e.stopPropagation()
                        blurActiveElement()
                        dispatch(populationFestivalActions.setId(id))
                        dispatch(populationFestivalActions.setCurrentPopulationFestival(params.row))
                        dispatch(
                          populationFestivalActions.openModal({
                            mode: 'edit',
                            populationFestivalId: id,
                            populationFestival: params.row
                          })
                        )
                      }}
                    >
                      <Icon icon='tabler:pencil' fontSize={20} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              {canEliminate && (
                <Tooltip title={t('Eliminate')} placement='top'>
                  <span>
                    <IconButton
                      size='small'
                      disabled={!id}
                      onClick={e => {
                        e.stopPropagation()
                        blurActiveElement()
                        dispatch(populationFestivalActions.setId(id))
                        dispatch(populationFestivalActions.setShowEliminateDialog(true))
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
    [dispatch, canUpdate, canEliminate, t]
  )

  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('desc')
  const [rows, setRows] = useState<any[]>([])
  const [sortColumn, setSortColumn] = useState<string>('day')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState<boolean>(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getPopulationFestivals({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.population_festivals ?? res.data?.data?.data ?? [])
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
      setSortColumn('day')

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

export default PopulationFestivalsTable
