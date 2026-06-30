// BillsTable.tsx
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
import { getBills } from 'src/api/api'

// Redux
import { billActions } from 'src/reducers/bills/BillReducer'

type SortType = 'asc' | 'desc' | undefined | null

const buildBillRequestFilters = (filters: any) => {
  const { course, course_text, ...rest } = filters ?? {}
  const nextFilters = { ...rest }

  if (course != null && course !== '') {
    nextFilters.course = course
  } else if (typeof course_text === 'string' && course_text.trim() !== '') {
    nextFilters.course = course_text.trim()
  }

  return nextFilters
}

const yesNoChip = (value: any, t: any) => {
  const v = String(value ?? '0')
  const isYes = v === '1' || v === 'true' || v === 'YES' || v === 'SI' || v === 'Sí'

  return (
    <Chip
      label={isYes ? t('Yes') : t('No')}
      color={isYes ? 'success' : 'warning'}
      variant='filled'
      size='small'
      sx={{ fontWeight: 600, minWidth: 70 }}
    />
  )
}

const BillsTable = () => {
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
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const appliedFilters = useSelector((state: RootState) => state.bill.appliedFilters)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.bills')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.bills')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const columns = useMemo(
    () => [
      {
        flex: 0.12,
        minWidth: 140,
        field: 'billing_number',
        headerName: t('Invoice number'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2' sx={{ fontWeight: 600 }}>
            {params.row?.billing_number}
          </Typography>
        )
      },
      {
        flex: 0.28,
        minWidth: 420,
        field: 'course',
        headerName: t('Course'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {params.row?.course_label ??
              params.row?.course_name ??
              params.row?.course?.name ??
              params.row?.course ??
              ''}
          </Typography>
        )
      },
      {
        flex: 0.1,
        minWidth: 120,
        field: 'year',
        headerName: t('Year'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const year =
            params.row?.year ??
            (params.row?.billing_date ? String(params.row.billing_date).slice(0, 4) : '') ??
            (params.row?.invoice_date ? String(params.row.invoice_date).slice(0, 4) : '')

          return <Typography variant='body2'>{year ?? ''}</Typography>
        }
      },
      {
        flex: 0.12,
        minWidth: 140,
        field: 'type',
        headerName: t('Type'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {params.row?.type ?? params.row?.bill_type ?? params.row?.course_type_name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.2,
        minWidth: 220,
        field: 'company',
        headerName: t('Company'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2' noWrap>
            {params.row?.company_name ?? params.row?.company?.name ?? params.row?.company ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.1,
        minWidth: 120,
        field: 'invoiced',
        headerName: t('Invoiced'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => yesNoChip(params.row?.invoiced, t)
      },
      {
        flex: 0.14,
        minWidth: 160,
        field: 'bonus_status',
        headerName: t('Bonus sent'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) =>
          yesNoChip(params.row.is_bonus == 1 && params.row?.bonus_status ? params.row?.bonus_status : 0, t)
      },
      {
        flex: 0.1,
        minWidth: 120,
        field: 'charged',
        headerName: t('Charged'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => yesNoChip(params.row?.charged, t)
      },
      {
        flex: 0.1,
        minWidth: 120,
        field: 'invoice', // “Factura”
        headerName: t('Invoice'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const amount = params.row?.billing ?? params.row?.invoice_amount ?? params.row?.factura ?? null
          const hasAmount = amount !== null && amount !== undefined && String(amount) !== ''

          return <Typography variant='body2'>{hasAmount ? Number(amount).toFixed(2) : ''}</Typography>
        }
      },
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
                      dispatch(billActions.setId(Number(id)))
                      dispatch(billActions.openModal({ mode: 'edit' }))
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
                      dispatch(billActions.setId(Number(id)))
                      dispatch(billActions.setShowEliminateDialog(true))
                    }}
                  >
                    <Icon icon='tabler:trash' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}
              {/*
              <Tooltip title={t('Generate PDF')} placement='top'>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    blurActiveElement()
                    generatePdf(id)
                  }}
                >
                  <Icon icon='tabler:file-type-pdf' fontSize={20} />
                </IconButton>
              </Tooltip>
              */}
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
  const [sortColumn, setSortColumn] = useState<string>('year')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [loading, setLoading] = useState<boolean>(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`
      const requestFilters = buildBillRequestFilters(appliedFilters)

      const res = await getBills({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...requestFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.bills ?? res.data?.data?.data ?? [])
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
      setSortColumn('year')

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
                dispatch(billActions.setId(Number(id)))
                dispatch(billActions.openModal({ mode: 'view' })) // bills: solo edit
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

export default BillsTable
