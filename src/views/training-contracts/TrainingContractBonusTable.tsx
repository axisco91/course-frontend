import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import Icon from 'src/@core/components/icon'
import dayjs from 'dayjs'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'

import { getTrainingContractBonuses } from 'src/api/api'
import { trainingContractBonusActions } from 'src/reducers/trainingContracts/TrainingContractBonusReducer'
import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'

type SortType = 'asc' | 'desc' | undefined | null

const yesNoChip = (value: any) => {
  const v = String(value ?? '0')
  const isYes = v === '1' || v === 'true' || v.toLowerCase() === 'si' || v === 'YES'

  return (
    <Chip
      label={isYes ? 'Si' : 'No'}
      color={isYes ? 'success' : 'warning'}
      variant='filled'
      size='small'
      sx={{ fontWeight: 600, minWidth: 70 }}
    />
  )
}

const fmt = (d?: string) => (d ? (dayjs(d).isValid() ? dayjs(d).format('DD/MM/YYYY') : String(d)) : '')

const firstFiniteNumber = (...values: any[]) => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue

    const number = Number(value)
    if (Number.isFinite(number)) return number
  }

  return undefined
}

const TrainingContractBonusTable = ({ disabledAll }: { disabledAll: boolean; open?: boolean }) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const filterButtonClickCount = useSelector((s: RootState) => s.general.filterButtonClickCount)
  const trainingContractId = useSelector((s: RootState) => (s as any).trainingContract?.id) as number | null

  const [total, setTotal] = useState<number>(0)
  const [rows, setRows] = useState([])
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sort, setSort] = useState<SortType>('desc')
  const [sortColumn, setSortColumn] = useState<string>('year')
  const [loading, setLoading] = useState(false)

  const recomputeTotals = useCallback(
    (list: any[], summary?: any) => {
      const fallbackTotalAmount = (Array.isArray(list) ? list : []).reduce((acc, b) => acc + Number(b?.amount ?? 0), 0)
      const totalAmount = firstFiniteNumber(
        summary?.total_amount,
        summary?.totalAmount,
        summary?.amount_total,
        summary?.amountTotal,
        summary?.bonus_total_amount,
        summary?.bonusTotalAmount,
        fallbackTotalAmount
      )
      const totalCalculatedHours =
        firstFiniteNumber(
          summary?.total_calculated_hours,
          summary?.totalCalculatedHours,
          summary?.calculated_hours,
          summary?.calculatedHours,
          summary?.total_hours,
          summary?.totalHours
        ) ?? (totalAmount ? totalAmount / 5 : 0)

      dispatch(trainingContractActions.setTotalAmount(totalAmount))
      dispatch(trainingContractActions.setTotalCalculatedHours(totalCalculatedHours))
    },
    [dispatch]
  )

  const fetchBonuses = useCallback(async () => {
    if (!trainingContractId) return
    setLoading(true)
    try {
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getTrainingContractBonuses(trainingContractId, {
        perPage: paginationModel.pageSize,
        page: paginationModel.page + 1,
        sort: sortTable
      })

      const data = res.data?.data
      const list = data?.training_contract_bonuses
      const meta = data?.meta ?? res.data?.meta

      setRows(Array.isArray(list) ? list : [])
      setTotal(meta?.total ?? (Array.isArray(list) ? list.length : 0))
      dispatch(trainingContractBonusActions.setTrainingContractsBonuses(Array.isArray(list) ? list : []))

      recomputeTotals(Array.isArray(list) ? list : [], data)
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [trainingContractId, paginationModel.page, paginationModel.pageSize, sort, sortColumn, dispatch, recomputeTotals])

  useEffect(() => {
    fetchBonuses()
  }, [fetchBonuses, filterButtonClickCount])

  const handleSortModel = (model: GridSortModel) => {
    if (!model.length) {
      setSort('desc')
      setSortColumn('year')

      return
    }
    setSort(model[0].sort ?? 'desc')
    setSortColumn(model[0].field)
  }

  const columns = useMemo(
    () => [
      {
        flex: 0.18,
        minWidth: 160,
        field: 'month_name',
        headerName: 'MES',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.month_name ?? ''}</Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 120,
        field: 'year',
        headerName: 'AÑO',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <Typography variant='body2'>{params.row?.year ?? ''}</Typography>
      },
      {
        flex: 0.16,
        minWidth: 140,
        field: 'start',
        headerName: 'EMPEZAR',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <Typography variant='body2'>{fmt(params.row?.start)}</Typography>
      },
      {
        flex: 0.16,
        minWidth: 140,
        field: 'end',
        headerName: 'FIN',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <Typography variant='body2'>{fmt(params.row?.end)}</Typography>
      },
      {
        flex: 0.14,
        minWidth: 140,
        field: 'amount',
        headerName: 'CANTIDAD',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2' sx={{ fontWeight: 600 }}>
            {params.row?.amount ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 120,
        field: 'invoiced',
        headerName: 'PAGADO',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => yesNoChip(params.row?.invoiced ?? 0)
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

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, width: '100%' }}>
              <Tooltip title='Editar' placement='top'>
                <span>
                  <IconButton
                    size='small'
                    disabled={disabledAll || !id}
                    onClick={e => {
                      e.stopPropagation()
                      dispatch(
                        trainingContractBonusActions.openModal({
                          mode: 'edit',
                          trainingContractBonusId: id,
                          trainingContractBonus: params.row
                        })
                      )
                    }}
                  >
                    <Icon icon='tabler:edit' fontSize={20} />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title='Eliminar' placement='top'>
                <span>
                  <IconButton
                    size='small'
                    disabled={disabledAll || !id}
                    onClick={e => {
                      e.stopPropagation()
                      dispatch(trainingContractBonusActions.setId(id))
                      dispatch(trainingContractBonusActions.setShowEliminateDialog(true))
                    }}
                  >
                    <Icon icon='tabler:trash' fontSize={20} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )
        }
      }
    ],
    [dispatch, disabledAll]
  )

  return (
    <Fragment>
      <Box sx={{ width: '100%' }}>
        <DataGrid
          disableColumnFilter
          disableRowSelectionOnClick
          rows={rows}
          columns={columns as any}
          getRowId={row => row.id}
          pagination
          autoHeight
          rowCount={total}
          paginationMode='server'
          sortingMode='server'
          sortingOrder={['asc', 'desc']}
          sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
          onSortModelChange={handleSortModel}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
        />
      </Box>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default TrainingContractBonusTable
