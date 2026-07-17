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

// ✅ endpoints reales (ajusta nombres)
import { getCredits } from 'src/api/api'
import CompanyCreditModal from './CompanyCreditModal'

// ✅ redux
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { creditActions } from 'src/reducers/company/CreditReducer'

type Props = {
  open: boolean
  companyId: number | null
}

type CreditMode = 'create' | 'edit'

const CompanyCreditsTable = ({ open, companyId }: Props) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)

  // refs estables
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  // ✅ modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<CreditMode>('create')
  const [editingId, setEditingId] = useState<number | null>(null)

  const openCreate = () => {
    setMode('create')
    setEditingId(null)
    setModalOpen(true)
  }

  const openEdit = (id: number) => {
    setMode('edit')
    setEditingId(id)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
  }

  // table state
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'year', sort: 'desc' }])

  const reqIdRef = useRef(0)

  const fetchCredits = useCallback(async () => {
    if (!open || !companyId) return

    const myReqId = ++reqIdRef.current
    setLoading(true)

    try {
      const field = sortModel?.[0]?.field ?? 'year'
      const dir = sortModel?.[0]?.sort ?? 'desc'
      const sort = dir === 'asc' ? field : `-${field}`

      const res = await getCredits({
        company_id: companyId,
        perPage: paginationModel.pageSize,
        page: paginationModel.page + 1,
        sort
      })

      if (myReqId !== reqIdRef.current) return

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.credits ?? [])
    } catch (e) {
      if (myReqId === reqIdRef.current) handleErrorRef.current(e, logoutRef.current)
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false)
    }
  }, [open, companyId, paginationModel.page, paginationModel.pageSize, sortModel])

  // recarga
  useEffect(() => {
    if (!open || !companyId) return
    fetchCredits()
  }, [fetchCredits])

  useEffect(() => {
    if (!open || !companyId) return
    fetchCredits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterButtonClickCount])

  useEffect(() => {
    if (!open || !companyId) return
    setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }))
  }, [open, companyId])

  // ✅ delete NO aquí: solo abrimos el dialog global
  const askDelete = (id: number) => {
    dispatch(creditActions.setId(id))
    dispatch(creditActions.setShowEliminateDialog(true))
  }

  const fmt = (v: any) => {
    const n = Number(v ?? 0)
    if (Number.isNaN(n)) return '0.00'

    return n.toFixed(2)
  }

  const columns = useMemo(() => {
    return [
      {
        flex: 0.22,
        minWidth: 200,
        field: 'available_credit',
        headerName: t('Available credit'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{fmt(p.row?.available_credit)}</Typography>
      },
      {
        flex: 0.22,
        minWidth: 200,
        field: 'consumed_credit',
        headerName: t('Consumed credit'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{fmt(p.row?.consumed_credit)}</Typography>
      },
      {
        flex: 0.22,
        minWidth: 200,
        field: 'remaining_credit',
        headerName: t('Remaining credit'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (p: GridRenderCellParams) => {
          const available = Number(p.row?.available_credit ?? 0)
          const consumed = Number(p.row?.consumed_credit ?? 0)
          const remaining = available - consumed

          return <Typography variant='body2'>{fmt(remaining)}</Typography>
        }
      },
      {
        flex: 0.16,
        minWidth: 140,
        field: 'year',
        headerName: t('Year'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row?.year ?? ''}</Typography>
      },
      {
        flex: 0.18,
        minWidth: 150,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (p: GridRenderCellParams) => {
          const id = Number(p.row?.id)

          return (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Tooltip title={t('Edit')} placement='top'>
                <IconButton size='small' onClick={() => openEdit(id)}>
                  <Icon icon='tabler:edit' fontSize={20} />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('Delete')} placement='top'>
                <IconButton size='small' onClick={() => askDelete(id)}>
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
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6' sx={{ fontWeight: 700 }}>
            {t('Credits')}
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
            pageSizeOptions={[10, 25, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={model => setPaginationModel(model)}
            sortModel={sortModel}
            onSortModelChange={model => setSortModel(model?.length ? model : [{ field: 'year', sort: 'desc' }])}
            getRowId={row => row.id}
          />
        </Box>
      </CardContent>

      {companyId && (
        <CompanyCreditModal
          open={modalOpen}
          mode={mode}
          companyId={companyId}
          creditId={editingId}
          onClose={closeModal}
          onSaved={() => {
            closeModal()
            fetchCredits()
          }}
        />
      )}

      {loading && <LoadingDialog />}
    </Card>
  )
}

export default CompanyCreditsTable
