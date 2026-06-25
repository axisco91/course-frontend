import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useTranslation } from 'react-i18next'

import Icon from 'src/@core/components/icon'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

// ✅ AJUSTA estos endpoints a los tuyos reales:
import { getCompanyObservations } from 'src/api/api'
import CompanyObservationModal from './CompanObservationModal'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { companyObservationActions } from 'src/reducers/company/CompanyObservationReducer'
import { useDispatch } from 'react-redux'

type Props = {
  open: boolean
  companyId: number | null
}

type ObsMode = 'create' | 'edit'

const CompanyObservationsTable = ({ open, companyId }: Props) => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const dispatch = useDispatch()

  // refs estables
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])
  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)

  // ✅ modal state (AQUÍ está la clave)
  const [obsModalOpen, setObsModalOpen] = useState(false)
  const [obsMode, setObsMode] = useState<ObsMode>('create')
  const [editingId, setEditingId] = useState<number | null>(null)

  const openCreate = () => {
    setObsMode('create')
    setEditingId(null)
    setObsModalOpen(true)
  }

  const openEdit = (id: number) => {
    setObsMode('edit')
    setEditingId(id)
    setObsModalOpen(true)
  }

  const closeModal = () => {
    setObsModalOpen(false)
    setEditingId(null)
  }

  // table state
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'date', sort: 'desc' }])

  const reqIdRef = useRef(0)

  const fetchObservations = useCallback(async () => {
    if (!open || !companyId) return

    const myReqId = ++reqIdRef.current
    setLoading(true)

    try {
      const field = sortModel?.[0]?.field ?? 'date'
      const dir = sortModel?.[0]?.sort ?? 'desc'
      const sort = dir === 'asc' ? field : `-${field}`

      const res = await getCompanyObservations(companyId, {
        perPage: paginationModel.pageSize,
        page: paginationModel.page + 1,
        sort
      })

      if (myReqId !== reqIdRef.current) return

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.company_observations ?? [])
    } catch (e) {
      if (myReqId === reqIdRef.current) handleErrorRef.current(e, logoutRef.current)
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false)
    }
  }, [open, companyId, paginationModel.page, paginationModel.pageSize, sortModel])

  useEffect(() => {
    if (!open || !companyId) return
    fetchObservations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterButtonClickCount])

  useEffect(() => {
    if (!open || !companyId) return
    setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }))
  }, [open, companyId])

  const handleDelete = async (id: number) => {
    dispatch(companyObservationActions.setId(id))
    dispatch(companyObservationActions.setShowEliminateDialog(true))
  }

  const columns = useMemo(() => {
    return [
      {
        flex: 0.18,
        minWidth: 140,
        field: 'date',
        headerName: t('Date'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.date ?? params.row?.created_at ?? ''}</Typography>
        )
      },
      {
        flex: 0.62,
        minWidth: 300,
        field: 'observation',
        headerName: t('Observation'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2' sx={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
            {params.row?.observation ?? params.row?.text ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.2,
        minWidth: 150,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => {
          const id = Number(params.row?.id)

          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={t('Edit')} placement='top'>
                <IconButton size='small' onClick={() => openEdit(id)}>
                  <Icon icon='tabler:edit' fontSize={20} />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('Delete')} placement='top'>
                <IconButton size='small' onClick={() => handleDelete(id)}>
                  <Icon icon='tabler:trash' fontSize={20} />
                </IconButton>
              </Tooltip>
            </Box>
          )
        }
      }
    ]
  }, [t])

  return (
    <Card>
      <CardContent>
        {/* Header con botón "Nueva" */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6' sx={{ fontWeight: 700 }}>
            {t('Observations')}
          </Typography>

          <Button variant='contained' onClick={openCreate} disabled={!companyId || loading}>
            <Icon icon='tabler:plus' fontSize={20} />
            {t('New')}
          </Button>
        </Box>

        <Box sx={{ height: '60vh', width: '100%' }}>
          <DataGrid
            disableColumnFilter
            disableRowSelectionOnClick
            rows={rows}
            columns={columns}
            rowCount={total}
            loading={loading}
            paginationMode='server'
            sortingMode='server'
            pageSizeOptions={[25, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={model => setPaginationModel(model)}
            sortModel={sortModel}
            onSortModelChange={model => setSortModel(model?.length ? model : [{ field: 'date', sort: 'desc' }])}
            getRowId={row => row.id}
          />
        </Box>
      </CardContent>

      {/* ✅ Modal SOLO se abre cuando tú pulsas New/Edit */}
      {companyId && (
        <CompanyObservationModal
          open={obsModalOpen}
          mode={obsMode}
          companyId={companyId}
          observationId={editingId}
          onClose={closeModal}
          onSaved={() => {
            closeModal()
            fetchObservations()
          }}
        />
      )}

      {loading && <LoadingDialog />}
    </Card>
  )
}

export default CompanyObservationsTable
