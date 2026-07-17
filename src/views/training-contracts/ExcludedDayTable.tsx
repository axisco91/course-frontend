// ExcludedDaysTable.tsx (LOCAL STATE)
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, IconButton, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridRenderCellParams } from 'src/views/components/DataGrid'
import Icon from 'src/@core/components/icon'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

import { getTrainingContractExcludedDays } from 'src/api/api'
import { excludedDayActions } from 'src/reducers/trainingContracts/ExcludedDayReducer'
import ExcludedDayModal from './ExcludedDaysModel'

const formatDMY = (s?: string) => {
  if (!s) return ''
  const d = String(s).slice(0, 10)
  const [y, m, day] = d.split('-')

  return y && m && day ? `${day}/${m}/${y}` : s
}

const ExcludedDaysTable = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const trainingContractId = useSelector((s: RootState) => (s as any).trainingContract?.id) as number | null
  const modalOpen = useSelector((s: RootState) => (s as any).excludedDay?.modalOpen) as boolean
  const filterButtonClickCount = useSelector((s: RootState) => s.general.filterButtonClickCount)

  // ✅ LOCAL rows (como TeachersCoursesTable)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRows = useCallback(async () => {
    if (!trainingContractId) return
    setLoading(true)
    try {
      const res = await getTrainingContractExcludedDays({ id: trainingContractId })
      const list =
        res.data?.data?.training_contract_excluded_days ?? res.data?.training_contract_excluded_days ?? res.data ?? []
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
        flex: 1,
        minWidth: 600,
        field: 'name',
        headerName: 'NOMBRE',
        renderCell: (params: GridRenderCellParams) => {
          const r = params.row || {}
          const type = r.excluded_day_type_name ?? r.type_name ?? r.type ?? 'Vacaciones'
          const start = formatDMY(r.beginning ?? r.start ?? r.start_date)
          const end = formatDMY(r.end ?? r.end_date ?? r.finish)
          const d1 = r.days ?? r.num_days ?? r.number_days
          const d2 = r.days_total ?? r.total_days

          const text =
            r.name ??
            `${type} ${start}${end ? ` - ${end}` : ''}${
              d1 != null ? ` Número de días: ${d1}${d2 != null ? ` / ${d2}` : ''}` : ''
            }`

          return (
            <Typography noWrap variant='body2'>
              {text}
            </Typography>
          )
        }
      },
      {
        flex: 0.15,
        minWidth: 140,
        field: 'actions',
        headerName: 'ACCIONES',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => {
          const group = params.row?.group

          return (
            <Tooltip title='Eliminar' placement='top'>
              <IconButton
                size='small'
                onClick={async e => {
                  e.stopPropagation()
                  if (!group) return
                  setLoading(true)
                  try {
                    dispatch(excludedDayActions.setId(Number(group)))
                    dispatch(excludedDayActions.setShowEliminateDialog(true))
                  } catch (err) {
                    handleErrorRef.current(err, logoutRef.current)
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                <Icon icon='tabler:trash' fontSize={20} />
              </IconButton>
            </Tooltip>
          )
        }
      }
    ],
    [fetchRows]
  )

  return (
    <Card>
      <CardContent sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant='contained'
          color='warning'
          onClick={() => dispatch(excludedDayActions.openModal({ mode: 'create' }))}
          disabled={!trainingContractId}
        >
          <Icon icon='tabler:plus' fontSize={20} />
          Añadir Días
        </Button>
      </CardContent>

      <CardContent>
        <Box sx={{ height: '45vh', width: '100%' }}>
          <DataGrid
            disableColumnFilter
            disableRowSelectionOnClick
            rows={rows}
            columns={columns as any}
            getRowId={row => row.group}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            loading={loading}
          />
        </Box>
      </CardContent>

      <ExcludedDayModal open={modalOpen} trainingContractId={trainingContractId} onSaved={fetchRows} />

      {loading && <LoadingDialog />}
    </Card>
  )
}

export default ExcludedDaysTable
