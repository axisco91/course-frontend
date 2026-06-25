// BillsTrainingContractTable.tsx
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

// ✅ API (este es el endpoint que comentaste)
import { getTrainingContractBills } from 'src/api/api'

// ✅ Redux (cambia la ruta si tu reducer está en otro sitio)
import { trainingContractBillActions } from 'src/reducers/bills/TrainingContractBillReducer'

type SortType = 'asc' | 'desc' | undefined | null

const yesNoChip = (value: any, t: any) => {
  const v = String(value ?? '0')
  const isYes = v === '1' || v === 'true' || v.toLowerCase() === 'si' || v === 'YES'

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

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const getMonthLabel = (value: any, t: any) => {
  if (!value) return ''
  const month = MONTHS.find(m => Number(m.value) === Number(value))

  return month ? t(month.label) : value
}

const TrainingContractBillsTable = () => {
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

  // ✅ filtros en SU reducer (billTrainingContract)
  const appliedFilters = useSelector((state: RootState) => (state as any).trainingContractBill?.appliedFilters ?? {})

  // ✅ permisos (ajusta strings si en tu backend son otros)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.bills')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.bills')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const columns = useMemo(
    () => [
      {
        flex: 0.1,
        minWidth: 110,
        field: 'number',
        headerName: t('Nº Fac'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2' sx={{ fontWeight: 600 }}>
            {params.row?.number}
          </Typography>
        )
      },
      {
        flex: 0.1,
        minWidth: 110,
        field: 'number_cfa',
        headerName: t('Nº CFA'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.cfa ?? params.row?.number_cfa ?? ''}</Typography>
        )
      },
      {
        flex: 0.26,
        minWidth: 240,
        field: 'student',
        headerName: t('Student'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 600 }}>
            {params.row?.student_name ??
              params.row?.student ??
              `${params.row?.student?.name ?? ''} ${params.row?.student?.surname ?? ''}`.trim()}
          </Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 130,
        field: 'month',
        headerName: t('Month'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const rawMonth = params.row?.month_name ?? params.row?.month

          return <Typography variant='body2'>{getMonthLabel(rawMonth, t)}</Typography>
        }
      },
      {
        flex: 0.1,
        minWidth: 110,
        field: 'year',
        headerName: t('Year'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <Typography variant='body2'>{params.row?.year ?? ''}</Typography>
      },
      {
        flex: 0.22,
        minWidth: 220,
        field: 'company',
        headerName: t('Company'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.company_name ?? params.row?.company?.name ?? params.row?.company ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 140,
        field: 'invoiced',
        headerName: t('Invoiced'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => yesNoChip(params.row?.invoiced ?? params.row?.invoice ?? 0, t)
      },
      {
        flex: 0.12,
        minWidth: 140,
        field: 'charged',
        headerName: t('Charged'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => yesNoChip(params.row?.charged ?? params.row?.charge ?? 0, t)
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
                      dispatch(trainingContractBillActions.setId?.(Number(id)) ?? { type: 'btc/setId', payload: id })
                      dispatch(
                        trainingContractBillActions.openModal?.({ mode: 'edit' }) ?? {
                          type: 'btc/openModal',
                          payload: { mode: 'edit' }
                        }
                      )
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
                      dispatch(trainingContractBillActions.setId?.(Number(id)) ?? { type: 'btc/setId', payload: id })
                      dispatch(
                        trainingContractBillActions.setShowEliminateDialog?.(true) ?? {
                          type: 'btc/setShowEliminateDialog',
                          payload: true
                        }
                      )
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
  const [sortColumn, setSortColumn] = useState<string>('year')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [loading, setLoading] = useState<boolean>(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getTrainingContractBills({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(
        res.data?.data?.training_contract_bills ?? res.data?.data?.data ?? res.data?.data?.billTrainingContracts ?? []
      )
      console.log(res.data?.data?.training_contract_bills)
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
              checkboxSelection
              disableRowSelectionOnClick
              getRowId={row => row.id ?? row.value}
              onRowClick={params => {
                blurActiveElement()
                const id = (params.row as any)?.id ?? (params.row as any)?.value ?? params.id
                dispatch(trainingContractBillActions.setId?.(Number(id)) ?? { type: 'btc/setId', payload: id })
                dispatch(
                  trainingContractBillActions.openModal?.({ mode: 'view' }) ?? {
                    type: 'btc/openModal',
                    payload: { mode: 'view' }
                  }
                )
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

export default TrainingContractBillsTable
