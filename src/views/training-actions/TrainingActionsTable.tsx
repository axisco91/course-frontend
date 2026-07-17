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

// ** API (✅ cambia si tu endpoint se llama distinto)
import { getTrainingActions } from 'src/api/api'

// ** Redux actions (✅ cambia si tu reducer se llama distinto)
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'
type SortType = 'asc' | 'desc' | undefined | null

const TrainingActionsTable = () => {
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
  const appliedFilters = useSelector((state: RootState) => state.trainingAction.appliedFilters)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.training_actions')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.training_actions')

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
        flex: 0.14,
        minWidth: 170,
        maxWidth: 220,
        field: 'formative_action',
        headerName: t('Formative Action'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 700 }}>
            {params.row?.formative_action}
          </Typography>
        )
      },

      // Name
      {
        flex: 0.34,
        minWidth: 360,
        field: 'name',
        headerName: t('Name'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Tooltip title={params.row?.name ?? ''} placement='top'>
            <Typography noWrap variant='body2' sx={{ fontWeight: 700 }}>
              {params.row?.name}
            </Typography>
          </Tooltip>
        )
      },

      // Hours
      {
        flex: 0.12,
        minWidth: 120,
        field: 'hours',
        headerName: t('Hours'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {params.row?.total_hours ?? params.row?.hours ?? params.row?.duration ?? ''}
          </Typography>
        )
      },

      // Professional family
      {
        flex: 0.16,
        minWidth: 190,
        field: 'professional_family',
        headerName: t('Professional family'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.professional_family_name ??
              params.row?.professional_family?.name ??
              params.row?.family_name ??
              ''}
          </Typography>
        )
      },

      // Professional area
      {
        flex: 0.16,
        minWidth: 190,
        field: 'professional_area',
        headerName: t('Professional area'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.professional_area_name ?? params.row?.professional_area?.name ?? params.row?.area_name ?? ''}
          </Typography>
        )
      },

      // Modality
      {
        flex: 0.14,
        minWidth: 160,
        field: 'modality',
        headerName: t('Modality'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {params.row?.modality_name ?? params.row?.modality?.name ?? params.row?.modality ?? ''}
          </Typography>
        )
      },

      // Provider
      {
        flex: 0.16,
        minWidth: 180,
        field: 'provider',
        headerName: t('Provider'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.provider_name ?? params.row?.provider?.name ?? params.row?.provider ?? ''}
          </Typography>
        )
      },

      // Status chip
      {
        flex: 0.12,
        minWidth: 140,
        field: 'status',
        headerName: t('Status'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const activeVal = params.row?.active
          const isActive = String(activeVal ?? '0') === '1' || activeVal === true

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
        minWidth: 110,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => {
          const id = params.row?.id

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, width: '100%' }}>
              {canUpdate && (
                <Tooltip title={t('Edit')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      if (!id) return
                      dispatch(trainingActionActions.setId(Number(id)))
                      dispatch(trainingActionActions.openModal({ mode: 'edit' }))
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
                      if (!id) return
                      dispatch(trainingActionActions.setId(Number(id)))
                      dispatch(trainingActionActions.setShowEliminateDialog(true))
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

      const res = await getTrainingActions({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.training_actions ?? res.data?.data?.data ?? [])
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
            disableColumnResize={false}
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
              dispatch(trainingActionActions.setId(Number(params.row.id)))
              dispatch(trainingActionActions.openModal({ mode: 'view' }))
            }}
          />
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default TrainingActionsTable
