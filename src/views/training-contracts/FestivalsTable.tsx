import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Card, CardContent, IconButton, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridRenderCellParams } from 'src/views/components/DataGrid'
import Icon from 'src/@core/components/icon'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

// API
import { getTrainingContractFestivals } from 'src/api/api'
import { festivalActions } from 'src/reducers/trainingContracts/FestivalReducer'

// reducer

const formatDMY = (s?: string) => {
  if (!s) return ''
  const d = String(s).slice(0, 10)
  const [y, m, day] = d.split('-')

  return y && m && day ? `${day}/${m}/${y}` : s
}

const FestivalsTable = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const trainingContractId = useSelector((s: RootState) => (s as any).trainingContract?.id) as number | null
  const filterButtonClickCount = useSelector((s: RootState) => s.general.filterButtonClickCount)

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRows = useCallback(async () => {
    if (!trainingContractId) return
    setLoading(true)
    try {
      const res = await getTrainingContractFestivals({ id: trainingContractId })
      const list =
        res.data?.data?.training_contract_festivals ??
        res.data?.training_contract_festivals ??
        res.data?.data ??
        res.data ??
        []
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [trainingContractId])

  useEffect(() => {
    fetchRows()
  }, [fetchRows, filterButtonClickCount])

  const columns = useMemo(
    () => [
      {
        flex: 0.55,
        minWidth: 320,
        field: 'name',
        headerName: 'NOMBRE',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 600 }}>
            {params.row?.name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.25,
        minWidth: 160,
        field: 'day',
        headerName: 'DIA',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{formatDMY(params.row?.day ?? params.row?.date)}</Typography>
        )
      },
      {
        flex: 0.2,
        minWidth: 140,
        field: 'actions',
        headerName: 'ACCIONES',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => {
          const id = Number(params.row?.id)

          return (
            <Tooltip title='Eliminar' placement='top'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  if (!id) return
                  dispatch(festivalActions.setId(id))
                  dispatch(festivalActions.setShowEliminateDialog(true))
                }}
              >
                <Icon icon='tabler:trash' fontSize={20} />
              </IconButton>
            </Tooltip>
          )
        }
      }
    ],
    [dispatch]
  )

  return (
    <Fragment>
      <Card>
        <CardContent>
          <Box sx={{ height: '55vh', width: '100%' }}>
            <DataGrid
              disableColumnFilter
              disableRowSelectionOnClick
              rows={rows}
              columns={columns as any}
              getRowId={row => row.id ?? `${row.day}-${row.name}`}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
              loading={loading}
            />
          </Box>
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default FestivalsTable
