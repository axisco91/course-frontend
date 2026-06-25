import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Card, CardContent, IconButton, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridRenderCellParams } from 'src/views/components/DataGrid'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import Icon from 'src/@core/components/icon'
import LoadingDialog from 'src/views/components/LoadingDialog'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

// ✅ API
import { getProviderTrainingActions } from 'src/api/api'

// ✅ Ajusta a tu reducer real
import { trainingActionActions } from 'src/reducers/trainingActions/TrainingActionReducer'

type Props = {
  open: boolean
  providerId: number | null
}

const ProviderTrainingActionsTab = ({ open, providerId }: Props) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  // (opcional) si quieres refrescar cuando pulses “filtrar/actualizar”
  const filterButtonClickCount = useSelector((s: RootState) => s.general.filterButtonClickCount)

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTrainingActions = useCallback(async () => {
    if (!open || !providerId) return

    setLoading(true)
    try {
      const res = await getProviderTrainingActions(providerId)

      // 🔧 Ajusta el payload real:
      const list =
        res.data?.data?.training_actions ??
        res.data?.data?.provider_training_actions ??
        res.data?.data ??
        res.data ??
        []

      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [open, providerId])

  useEffect(() => {
    fetchTrainingActions()
  }, [fetchTrainingActions, filterButtonClickCount])

  const columns = useMemo(
    () => [
      {
        flex: 0.85,
        minWidth: 300,
        field: 'name',
        headerName: 'NOMBRE',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 600 }}>
            {params.row?.name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.15,
        minWidth: 120,
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <Tooltip title='Ver' placement='top'>
                <span>
                  <IconButton
                    size='small'
                    disabled={!id}
                    onClick={e => {
                      e.stopPropagation()
                      if (!id) return

                      // ✅ igual que el antiguo: abrir modal de training action en info/view
                      dispatch(trainingActionActions.setId(id))
                      dispatch(trainingActionActions.openModal({ mode: 'view' })) // ajusta a tu reducer si usa 'info'
                    }}
                  >
                    <Icon icon='tabler:eye' fontSize={20} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
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
          <Box sx={{ width: '100%' }}>
            <DataGrid
              autoHeight
              disableRowSelectionOnClick
              disableColumnFilter
              rows={rows}
              columns={columns as any}
              getRowId={row => row.id ?? row.value}
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

export default ProviderTrainingActionsTab
