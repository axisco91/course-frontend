// ** React Imports
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

// ** API
import { getCompanies } from 'src/api/api'

// ** Redux actions
import { companyActions } from 'src/reducers/company/CompanyReducer'
type SortType = 'asc' | 'desc' | undefined | null

const CompaniesTable = () => {
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
  const appliedFilters = useSelector((state: RootState) => state.company.appliedFilters)
  const canUpdate = userPermissions.includes('edit.companies')
  const canEliminate = userPermissions.includes('eliminate.companies')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  // ===========================
  // 📊 Columns
  // ===========================
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
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.cif ?? params.row?.nif ?? ''}</Typography>
        )
      },
      {
        minWidth: 180,
        field: 'company_type',
        headerName: t('Company type'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.company_type?.name ?? params.row?.company_type_name ?? ''}
          </Typography>
        )
      },
      {
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
        minWidth: 180,
        field: 'consultant',
        headerName: t('Consultant'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.consultant_name ??
              (params.row?.consultant
                ? `${params.row.collaborator.name ?? ''} ${params.row.collaborator.surname ?? ''}`.trim()
                : '')}
          </Typography>
        )
      },
      {
        minWidth: 180,
        field: 'advisor',
        headerName: t('Advisor'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.advisor_name ??
              (params.row?.advisor
                ? `${params.row.advisor.name ?? ''} ${params.row.advisor.surname ?? ''}`.trim()
                : '')}
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
          const potential = String(params.row?.potential ?? '0') === '1'

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
        minWidth: 200,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
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
                      dispatch(companyActions.setId(id))
                      dispatch(companyActions.openModal({ mode: 'edit' }))
                    }}
                  >
                    <Icon icon='tabler:pencil' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}
              {!params.row.advisor_company && params.row.potential == 0 && (
                <Tooltip title={t('Convert to Advisor')}>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(companyActions.setId(id))
                      dispatch(companyActions.setShowAdvisorDialog(true))
                    }}
                  >
                    <Icon icon='tabler:user-star' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}
              {!params.row.provider && params.row.potential == 0 && (
                <Tooltip title={t('Convert to Provider')}>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(companyActions.setId(id))
                      dispatch(companyActions.setShowProviderDialog(true))
                    }}
                  >
                    <Icon icon='tabler:briefcase' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}
              {params.row.potential == 1 && (
                <Tooltip title={t('Convert to Client')}>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(companyActions.setId(id))
                      dispatch(companyActions.setShowClientDialog(true))
                    }}
                  >
                    <Icon icon='tabler:user-check' fontSize={20} />
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
                      dispatch(companyActions.setId(id))
                      dispatch(companyActions.setShowEliminateDialog(true))
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
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getCompanies({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.companies ?? res.data?.data?.data ?? [])
      console.log(res.data?.data?.companies)
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
            pageSizeOptions={[25, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
            onSortModelChange={handleSortModel}
            onRowClick={params => {
              blurActiveElement()
              dispatch(companyActions.setId(params.row.id))
              dispatch(companyActions.openModal({ mode: 'view' }))
            }}
          />
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default CompaniesTable
