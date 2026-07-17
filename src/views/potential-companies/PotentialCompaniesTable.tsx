import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Card, CardContent, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import Icon from 'src/@core/components/icon'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { getPotentialCompanies } from 'src/api/api'
import { potentialCompanyActions } from 'src/reducers/company/PotentialCompanyReducer'
type SortType = 'asc' | 'desc' | undefined | null

const PotentialCompaniesTable = () => {
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
  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const appliedFilters = useSelector((state: RootState) => (state as any).potentialCompany.appliedFilters)
  const canUpdate = userPermissions.includes('edit.potential_companies')
  const canEliminate = userPermissions.includes('eliminate.potential_companies')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const columns = useMemo(
    () => [
      {
        minWidth: 220,
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
        minWidth: 140,
        field: 'nif',
        headerName: t('CIF'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <Typography variant='body2'>{params.row?.nif ?? ''}</Typography>
      },
      {
        minWidth: 180,
        field: 'type',
        headerName: t('Type'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.type ?? params.row?.company_type?.name ?? ''}
          </Typography>
        )
      },
      {
        minWidth: 200,
        field: 'activity',
        headerName: t('Activity'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.activity ?? params.row?.company_activity?.name ?? ''}
          </Typography>
        )
      },
      {
        minWidth: 180,
        field: 'email',
        headerName: t('Email'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.email ?? ''}
          </Typography>
        )
      },
      {
        minWidth: 120,
        field: 'status',
        headerName: t('Status'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const active = String(params.row?.active ?? '0') === '1'
          const potential = String(params.row?.potential ?? '1') === '1'
          let label = t('Inactive')
          let color: 'success' | 'warning' | 'error' = 'error'
          if (active) {
            label = t('Active')
            color = 'success'
          } else if (potential) {
            label = t('Potential')
            color = 'warning'
          }

          return <Chip label={label} color={color} size='small' sx={{ fontWeight: 700, minWidth: 90 }} />
        }
      },
      {
        minWidth: 130,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const id = Number(params.row?.id)

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              {canUpdate && (
                <Tooltip title={t('Edit')}>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(potentialCompanyActions.setId(id))
                      dispatch(potentialCompanyActions.openModal({ mode: 'edit', companyId: id }))
                    }}
                  >
                    <Icon icon='tabler:pencil' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}
              {canEliminate && (
                <Tooltip title={t('Delete')}>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(potentialCompanyActions.setId(id))
                      dispatch(potentialCompanyActions.setShowEliminateDialog(true))
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

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<SortType>('asc')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getPotentialCompanies({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.potential_companies ?? res.data?.data?.companies ?? res.data?.data?.data ?? [])
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
          <DataGrid
            autoHeight
            disableRowSelectionOnClick
            disableColumnFilter
            rows={rows}
            columns={columns}
            getRowId={row => row.id}
            rowCount={total}
            loading={loading}
            paginationMode='server'
            sortingMode='server'
            sortingOrder={['asc', 'desc']}
            pageSizeOptions={[10, 25, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
            onSortModelChange={handleSortModel}
            onRowClick={params => {
              blurActiveElement()
              const id = Number((params.row as any)?.id)
              dispatch(potentialCompanyActions.setId(id))
              dispatch(potentialCompanyActions.openModal({ mode: canUpdate ? 'edit' : 'view', companyId: id }))
            }}
          />
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default PotentialCompaniesTable
