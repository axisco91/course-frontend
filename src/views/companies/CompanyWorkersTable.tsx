import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useTranslation } from 'react-i18next'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'

// ✅ usa tu endpoint real (si esto en realidad es companyWorkers, cámbialo)
import { companyStudents } from 'src/api/api'

// ✅ redux
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { studentActions } from 'src/reducers/students/StudentReducer'

type Props = {
  open: boolean
  companyId: number | null // ⚠️ si realmente es companyId, renómbralo aquí y en el fetch
  active?: boolean
}

const CompanyWorkersTable = ({ open, companyId, active = true }: Props) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canViewStudents = Array.isArray(userPermissions) && userPermissions.includes('read.students')

  // ✅ refs estables
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
        flex: 0.28,
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
        flex: 0.14,
        minWidth: 130,
        field: 'dni',
        headerName: t('DNI'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <Typography variant='body2'>{params.row?.dni ?? ''}</Typography>
      }
    ]

    if (canViewStudents) {
      base.push({
        flex: 0.1,
        minWidth: 90,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => {
          const sid = params.row?.student_id ?? params.row?.id

          return (
            <Tooltip title={t('View student')} placement='top'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  blurActiveElement()
                  if (!sid) return

                  dispatch(studentActions.setId(Number(sid)))

                  // ✅ tú ajustas el reducer/nombre si hace falta
                  dispatch(studentActions.openStudentModal({ mode: 'view', studentId: Number(sid) }))
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

  const fetchWorkers = useCallback(async () => {
    if (!open || !companyId) return

    const myReqId = ++reqIdRef.current
    setLoading(true)

    try {
      const field = sortModel?.[0]?.field ?? 'name'
      const dir = sortModel?.[0]?.sort ?? 'asc'
      const sort = dir === 'asc' ? field : `-${field}`

      const res = await companyStudents(companyId, {
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
  }, [open, active, companyId, paginationModel.page, paginationModel.pageSize, sortModel])

  useEffect(() => {
    fetchWorkers()
  }, [fetchWorkers])

  useEffect(() => {
    if (!open || !companyId) return
    setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }))
  }, [open, companyId])

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

            // ✅ id robusto
            getRowId={row =>
              row.registration_id ??
              row.student_id ??
              row.id ??
              `${row.dni ?? 'no-dni'}-${row.name ?? 'no-name'}-${row.surname ?? 'no-surname'}`
            }
          />
        </Box>
      </CardContent>

      {loading && <LoadingDialog />}
    </Card>
  )
}

export default CompanyWorkersTable
