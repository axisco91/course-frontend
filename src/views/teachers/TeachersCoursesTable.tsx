import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useTranslation } from 'react-i18next'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { getTeacherCourses } from 'src/api/api'
import Icon from 'src/@core/components/icon'

// ✅ redux
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { courseActions } from 'src/reducers/courses/CourseReducer'

type Props = {
  open: boolean
  teacherId: number | null
  active?: boolean
}

const TeachersCoursesTable = ({ open, teacherId, active = true }: Props) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canViewCourses = Array.isArray(userPermissions) && userPermissions.includes('read.courses')

  // ✅ refs para no meter funciones inestables en deps
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])
  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const openCourseView = useCallback(
    (idLike: any) => {
      if (!canViewCourses) return

      const id = Number(idLike)
      if (!id) return

      dispatch(courseActions.openModal({ mode: 'view', courseId: id }))
    },
    [canViewCourses, dispatch]
  )

  const columns = useMemo(
    () => [
      {
        flex: 0.45,
        minWidth: 240,
        field: 'name',
        headerName: t('Course'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 600 }}>
            {params.row?.name ?? params.row?.course_name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.2,
        minWidth: 140,
        field: 'beginning',
        headerName: t('Beginning'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.beginning ?? params.row?.start_date ?? ''}</Typography>
        )
      },
      {
        flex: 0.2,
        minWidth: 140,
        field: 'end',
        headerName: t('End'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.end ?? params.row?.end_date ?? ''}</Typography>
        )
      },
      {
        flex: 0.15,
        minWidth: 90,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          if (!canViewCourses) return null

          // ✅ en registrations suele venir course_id
          const courseIdFromRow = params.row?.course_id ?? params.row?.courseId ?? params.row?.id ?? params.row?.value

          return (
            <Tooltip title={t('View')} placement='top'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  openCourseView(courseIdFromRow)
                }}
              >
                <Icon icon='tabler:eye' fontSize={20} />
              </IconButton>
            </Tooltip>
          )
        }
      }
    ],
    [t, canViewCourses, openCourseView]
  )

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }])

  const reqIdRef = useRef(0)

  const fetchCourses = useCallback(async () => {
    if (!open || !active || !teacherId) return

    const myReqId = ++reqIdRef.current
    setLoading(true)

    try {
      const field = sortModel?.[0]?.field ?? 'name'
      const dir = sortModel?.[0]?.sort ?? 'asc'
      const sort = dir === 'asc' ? field : `-${field}`

      const res = await getTeacherCourses(teacherId, {
        perPage: paginationModel.pageSize,
        page: paginationModel.page + 1,
        sort
      })

      if (myReqId !== reqIdRef.current) return

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.registrations ?? res.data?.data?.courses ?? [])
    } catch (error) {
      if (myReqId === reqIdRef.current) {
        handleErrorRef.current(error, logoutRef.current)
      }
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false)
    }
  }, [open, active, teacherId, paginationModel.page, paginationModel.pageSize, sortModel])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    if (!open || !teacherId) return
    setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }))
  }, [open, teacherId])

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

            // ✅ importante: id único por fila (registration)
            getRowId={row => row.registration_id ?? row.id ?? `${row.course_id}-${row.teacher_id}-${row.beginning}`}
            onRowClick={params => {
              const courseIdFromRow =
                (params.row as any)?.course_id ?? (params.row as any)?.courseId ?? (params.row as any)?.id
              openCourseView(courseIdFromRow)
            }}
          />
        </Box>
      </CardContent>

      {loading && <LoadingDialog />}
    </Card>
  )
}

export default TeachersCoursesTable
