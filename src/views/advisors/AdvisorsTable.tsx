// AdvisorsTable.tsx
import { useEffect, useState, useCallback, Fragment, useContext, useMemo, useRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'

// ** i18n
import { useTranslation } from 'react-i18next'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Icons
import Icon from 'src/@core/components/icon'

// ** Utils
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'

// ** API (ajusta al endpoint real de advisors si es distinto)
import { getAdvisors } from 'src/api/api'

// ** Redux actions (ajusta paths/nombres si difieren)
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
type SortType = 'asc' | 'desc' | undefined | null

const AdvisorsTable = () => {
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
  const appliedFilters = useSelector((state: RootState) => state.advisor.appliedFilters)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.advisors')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.advisors')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  // ===========================
  // 📊 Columns (ONLY requested)
  // name, cif, company_type, email, telephone, legal_representative
  // ===========================
  const columns = useMemo(
    () => [
      {
        flex: 0.22,
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
        flex: 0.14,
        minWidth: 140,
        field: 'cif',
        headerName: t('CIF'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.cif ?? params.row?.nif ?? ''}</Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 180,
        field: 'company_type',
        headerName: t('Company type'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.company_type?.name ?? params.row?.company_type_name ?? params.row?.company_type ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.22,
        minWidth: 240,
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
        flex: 0.14,
        minWidth: 140,
        field: 'telephone',
        headerName: t('Telephone'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.telephone ?? ''}</Typography>
        )
      },
      {
        flex: 0.2,
        minWidth: 220,
        field: 'legal_representative',
        headerName: t('Legal representative'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.legal_representative ?? params.row?.legalRepresentative ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 120,
        field: 'status',
        headerName: t('Status'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const isActive = String(params.row?.active ?? '0') === '1'

          return (
            <Chip
              label={isActive ? t('Active') : t('Inactive')}
              color={isActive ? 'success' : 'error'}
              size='small'
              sx={{ fontWeight: 700, minWidth: 90 }}
            />
          )
        }
      },
      {
        flex: 0.12,
        minWidth: 90,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams) => {
          const id = params.row?.id

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              {canUpdate && (
                <Tooltip title={t('Edit')}>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(advisorActions.setId(Number(id)))
                      dispatch(advisorActions.openModal({ mode: 'edit' }))
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
                      dispatch(advisorActions.setId(Number(id)))
                      dispatch(advisorActions.setShowEliminateDialog(true))
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

  // ===========================
  // 📡 State
  // ===========================
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<SortType>('asc')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  // ===========================
  // 🔁 Fetch
  // ===========================
  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getAdvisors({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.advisors ?? res.data?.data?.data ?? [])
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
              dispatch(advisorActions.setId(Number(params.row.id)))
              dispatch(advisorActions.openModal({ mode: 'view' }))
            }}
          />
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default AdvisorsTable
