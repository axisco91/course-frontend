import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Card, CardContent, IconButton, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from '../../hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

// ✅ endpoint correcto
import { getUserCommissions } from 'src/api/api'

import LoadingDialog from '../components/LoadingDialog'
import Icon from 'src/@core/components/icon'
import { userCommissionActions } from 'src/reducers/users/UserCommissionReducer'
import UserCommissionModal from './UserCommissionModal'

// ✅ si ya lo tienes

const UsersCommissionsTab = ({ open, userId }: { open: boolean; userId: number | null }) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  // ✅ para recargar cuando guardas desde el modal (como el resto)
  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // sorting local
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'commission_type', sort: 'asc' }])

  const fetchRows = useCallback(async () => {
    if (!open || !userId) return
    setLoading(true)

    try {
      const res = await getUserCommissions(userId)

      const list = res.data?.data?.user_commissions ?? res.data?.data?.commissions ?? res.data?.data ?? res.data ?? []
      setRows(list)
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [open, userId])

  // ✅ aquí está la clave: recarga también cuando cambia filterButtonClickCount
  useEffect(() => {
    fetchRows()
  }, [fetchRows, filterButtonClickCount])

  const columns = useMemo(
    () => [
      {
        flex: 0.22,
        minWidth: 180,
        field: 'name',
        headerName: 'NOMBRE',
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row?.name ?? ''}</Typography>
      },
      {
        flex: 0.22,
        minWidth: 180,
        field: 'commission_type',
        headerName: 'TIPO COMISIÓN',
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row?.commission_type ?? ''}</Typography>
      },
      {
        flex: 0.2,
        minWidth: 160,
        field: 'amount',
        headerName: 'TOTAL ASESORÍA',
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row?.amount ?? ''}</Typography>
      },
      {
        flex: 0.12,
        minWidth: 120,
        field: 'actions',
        headerName: 'ACCIONES',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (p: GridRenderCellParams) => {
          const id = Number(p.row?.id)

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%' }}>
              <Tooltip title='Editar' placement='top'>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    if (!id) return
                    dispatch(userCommissionActions.setId(id))
                    dispatch(userCommissionActions.openModal({ mode: 'edit' }))
                  }}
                >
                  <Icon icon='tabler:edit' fontSize={20} />
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
            loading={loading}
            sortingMode='client'
            sortModel={sortModel}
            onSortModelChange={model =>
              setSortModel(model?.length ? model : [{ field: 'commission_type', sort: 'asc' }])
            }
            getRowId={row => row.id}
          />
        </Box>
      </CardContent>

      {loading && <LoadingDialog />}

      {/* ✅ modal montado aquí */}
      <UserCommissionModal />
    </Card>
  )
}

export default UsersCommissionsTab
