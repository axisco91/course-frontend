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
import { companyCourses, getCompanyCoursesExportExcel } from 'src/api/api'

// ✅ redux
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { Button } from '@mui/material'

type Props = {
  open: boolean
  companyId: number | null // ⚠️ si realmente es companyId, renómbralo aquí y en el fetch
  active?: boolean
}

const CompanyCoursesTable = ({ open, companyId, active = true }: Props) => {
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

  const obtainExcel = async () => {
    setLoading(true)
    try {
      const res = await getCompanyCoursesExportExcel(companyId)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cursos_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      handleError(err, logout)
    } finally {
      setLoading(false)
    }
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
        field: 'group',
        headerName: t('Group'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <Typography variant='body2'>{params.row?.group ?? ''}</Typography>
      },
      {
        flex: 0.14,
        minWidth: 130,
        field: 'beginning',
        headerName: t('Beginning'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.beginning ?? ''}</Typography>
        )
      },
      {
        flex: 0.14,
        minWidth: 130,
        field: 'end',
        headerName: t('End'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <Typography variant='body2'>{params.row?.end ?? ''}</Typography>
      },
      {
        flex: 0.14,
        minWidth: 130,
        field: 'course_type',
        headerName: t('Type'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.course_type?.name ?? ''}</Typography>
        )
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
            <Tooltip title={t('View Course')} placement='top'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  blurActiveElement()
                  if (!sid) return

                  dispatch(courseActions.setId(Number(sid)))

                  // ✅ tú ajustas el reducer/nombre si hace falta
                  dispatch(courseActions.openModal({ mode: 'view', courseId: Number(sid) }))
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

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }])

  const reqIdRef = useRef(0)

  const fetchCourses = useCallback(async () => {
    if (!open || !companyId) return

    const myReqId = ++reqIdRef.current
    setLoading(true)

    try {
      const field = sortModel?.[0]?.field ?? 'name'
      const dir = sortModel?.[0]?.sort ?? 'asc'
      const sort = dir === 'asc' ? field : `-${field}`

      const res = await companyCourses(companyId, {
        perPage: paginationModel.pageSize,
        page: paginationModel.page + 1,
        sort
      })

      if (myReqId !== reqIdRef.current) return

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.courses ?? [])
      console.log(res.data?.data?.courses)
    } catch (error) {
      if (myReqId === reqIdRef.current) handleErrorRef.current(error, logoutRef.current)
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false)
    }
  }, [open, active, companyId, paginationModel.page, paginationModel.pageSize, sortModel])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    if (!open || !companyId) return
    setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }))
  }, [open, companyId])

  return (
    <Card>
      <CardContent>
        <Box>
          <Button variant='contained' sx={{ mr: 4 }} type='button' color='warning' onClick={obtainExcel}>
            <Icon icon='tabler:download' fontSize={20} />
            {t('Download List')}
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

export default CompanyCoursesTable
