// src/views/trainingContracts/tabs/HistoricalTable.tsx
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Card, CardContent, IconButton, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import Icon from 'src/@core/components/icon'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

import { getTrainingContractIncidences } from 'src/api/api'
import { trainingContractIncidenceActions } from 'src/reducers/trainingContracts/TrainingContractIncidenceReducer'

type Props = {
  open: boolean
  trainingContractId: number | null
}

const HistoricalTable = ({ open, trainingContractId }: Props) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const filterButtonClickCount = useSelector((s: RootState) => s.general.filterButtonClickCount)

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'created', sort: 'desc' }])

  const reqIdRef = useRef(0)

  const fetchRows = useCallback(async () => {
    if (!open || !trainingContractId) return

    const myReqId = ++reqIdRef.current
    setLoading(true)

    try {
      const field = sortModel?.[0]?.field ?? 'created'
      const dir = sortModel?.[0]?.sort ?? 'desc'
      const sort = dir === 'asc' ? field : `-${field}`

      const res = await getTrainingContractIncidences(trainingContractId, {
        perPage: paginationModel.pageSize,
        page: paginationModel.page + 1,
        sort
      })

      if (myReqId !== reqIdRef.current) return

      // ajusta a tu payload real
      const list =
        res.data?.data?.incidences ??
        res.data?.data?.training_contract_incidences ??
        res.data?.data?.data ??
        res.data?.data ??
        []

      setRows(Array.isArray(list) ? list : [])
      setTotal(res.data?.data?.meta?.total ?? res.data?.meta?.total ?? 0)
    } catch (e) {
      if (myReqId === reqIdRef.current) handleErrorRef.current(e, logoutRef.current)
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false)
    }
  }, [open, trainingContractId, paginationModel.page, paginationModel.pageSize, sortModel])

  useEffect(() => {
    fetchRows()
  }, [fetchRows, filterButtonClickCount])

  useEffect(() => {
    if (!open || !trainingContractId) return
    setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }))
  }, [open, trainingContractId])

  const columns = useMemo(
    () => [
      {
        flex: 0.25,
        minWidth: 220,
        field: 'affair',
        headerName: 'ASUNTO',
        headerAlign: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 700 }}>
            {p.row?.affair ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 160,
        field: 'incidence_type',
        headerName: 'TIPO',
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography variant='body2'>{p.row?.incidence_type ?? p.row?.type ?? ''}</Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 160,
        field: 'user',
        headerName: 'USUARIO',
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography variant='body2'>{p.row?.user ?? p.row?.user_name ?? ''}</Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 160,
        field: 'created',
        headerName: 'FECHA',
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography variant='body2'>{p.row?.created ?? p.row?.created_at ?? ''}</Typography>
        )
      },
      {
        flex: 0.35,
        minWidth: 360,
        field: 'notes',
        headerName: 'OBSERVACIÓN',
        headerAlign: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {p.row?.notes ?? p.row?.observation ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 110,
        field: 'actions',
        headerName: 'ACCIONES',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (p: GridRenderCellParams) => {
          const id = p.row?.id

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%' }}>
              <Tooltip title='Editar' placement='top'>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    if (!id) return
                    dispatch(trainingContractIncidenceActions.setId(Number(id)))
                    dispatch(trainingContractIncidenceActions.openModal({ mode: 'edit' }))
                  }}
                >
                  <Icon icon='tabler:pencil' fontSize={20} />
                </IconButton>
              </Tooltip>

              <Tooltip title='Eliminar' placement='top'>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    if (!id) return
                    dispatch(trainingContractIncidenceActions.setId(Number(id)))
                    dispatch(trainingContractIncidenceActions.setShowEliminateDialog(true))
                  }}
                >
                  <Icon icon='tabler:trash' fontSize={20} />
                </IconButton>
              </Tooltip>
            </Box>
          )
        }
      }
    ],
    [dispatch]
  )

  return (
    <Card>
      <CardContent>
        <Box sx={{ height: '55vh', width: '100%' }}>
          <DataGrid
            disableColumnFilter
            disableRowSelectionOnClick
            rows={rows}
            columns={columns as any}
            rowCount={total}
            loading={loading}
            paginationMode='server'
            sortingMode='server'
            pageSizeOptions={[10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={model => setSortModel(model?.length ? model : [{ field: 'created', sort: 'desc' }])}
            getRowId={row => row.id ?? `${row.created_at ?? row.created}-${row.affair ?? ''}`}
          />
        </Box>
      </CardContent>

      {loading && <LoadingDialog />}
    </Card>
  )
}

export default HistoricalTable
