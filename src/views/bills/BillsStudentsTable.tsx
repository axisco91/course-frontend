import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useTranslation } from 'react-i18next'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'

// ✅ endpoint real
import { getBillStudents } from 'src/api/api'

// ✅ redux
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { studentActions } from 'src/reducers/students/StudentReducer'

type Props = {
  open: boolean
  billId: number | null
}

const ProfitsStudentsTable = ({ open, billId }: Props) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canViewStudents = Array.isArray(userPermissions) && userPermissions.includes('read.students')

  // ✅ stable refs (avoid unstable deps)
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])
  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const columns = useMemo(() => {
    const base: any[] = [
      {
        flex: 0.3,
        minWidth: 220,
        field: 'name',
        headerName: t('Name'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 600 }}>
            {params.row?.name ?? ''} {params.row?.surname ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 140,
        field: 'dni',
        headerName: t('DNI'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <Typography variant='body2'>{params.row?.dni ?? ''}</Typography>
      },
      {
        flex: 0.28,
        minWidth: 200,
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
        flex: 0.16,
        minWidth: 120,
        field: 'price',
        headerName: t('Price'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <Typography variant='body2'>{params.row?.price ?? ''}</Typography>
      },
      {
        flex: 0.16,
        minWidth: 140,
        field: 'bonification',
        headerName: t('Bonification'),
        headerAlign: 'center',
        align: 'center',
        sortable: true,
        renderCell: (params: GridRenderCellParams) => {
          const raw = params.row?.bonification
          const isYes = String(raw) === '1' || raw === true

          return (
            <Chip
              label={isYes ? t('Yes') : t('No')}
              color={isYes ? 'success' : 'error'}
              variant='filled'
              size='small'
              sx={{ fontWeight: 700, minWidth: 70 }}
            />
          )
        }
      }
    ]

    if (canViewStudents) {
      base.push({
        flex: 0.12,
        minWidth: 90,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => {
          const studentId = params.row?.student_id ?? params.row?.id

          return (
            <Tooltip title={t('View student')} placement='top'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  blurActiveElement()
                  if (!studentId) return
                  dispatch(studentActions.setId(Number(studentId)))
                  dispatch(studentActions.openStudentModal({ mode: 'view', studentId: Number(studentId) }))
                }}
              >
                <Icon icon='tabler:eye' fontSize={20} />
              </IconButton>
            </Tooltip>
          )
        }
      })
    }

    return base
  }, [t, canViewStudents, dispatch])

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }])

  const reqIdRef = useRef(0)

  // ✅ limpia cuando cierras o no hay profitId
  useEffect(() => {
    if (!open || !billId) {
      setRows([])
      setTotal(0)
      setLoading(false)
    }
  }, [open, billId])

  const fetchStudents = useCallback(async () => {
    if (!open || !billId) return

    const myReqId = ++reqIdRef.current
    setLoading(true)

    try {
      const field = sortModel?.[0]?.field ?? 'name'
      const dir = sortModel?.[0]?.sort ?? 'asc'
      const sort = dir === 'asc' ? field : `-${field}`

      const res = await getBillStudents(billId, {
        perPage: paginationModel.pageSize,
        page: paginationModel.page + 1,
        sort
      })

      if (myReqId !== reqIdRef.current) return

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.students ?? res.data?.data?.registrations ?? [])
    } catch (error) {
      if (myReqId === reqIdRef.current) handleErrorRef.current(error, logoutRef.current)
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false)
    }
  }, [open, billId, paginationModel.page, paginationModel.pageSize, sortModel])

  // ✅ llama cuando toca (open/profitId/paginación/sort)
  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // ✅ cuando cambia profitId, vuelve a page 0
  useEffect(() => {
    if (!open || !billId) return
    setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }))
  }, [open, billId])

  return (
    <Card>
      <CardContent>
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
            onPaginationModelChange={model => {
              setPaginationModel(prev => (prev.page === model.page && prev.pageSize === model.pageSize ? prev : model))
            }}
            sortModel={sortModel}
            onSortModelChange={model => {
              const next = model?.length ? model : [{ field: 'name', sort: 'asc' }]
              setSortModel(prev => {
                const p0 = prev?.[0]
                const n0 = next?.[0]
                if (p0?.field === n0?.field && p0?.sort === n0?.sort) return prev

                return next
              })
            }}
            getRowId={row => row.id ?? row.student_id ?? row.registration_id ?? `${row.dni}-${row.name}-${row.surname}`}
          />
        </Box>
      </CardContent>

      {loading && <LoadingDialog />}
    </Card>
  )
}

export default ProfitsStudentsTable
