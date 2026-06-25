import { Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { CardContent, Chip, IconButton, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { getPotentialStudents } from 'src/api/api'
import { potentialStudentActions } from 'src/reducers/students/PotentialStudentReducer'
import { RootState } from 'src/reducers/types/types'

type SortType = 'asc' | 'desc' | undefined | null

const PotentialStudentsTable = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])
  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.potential_students')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.potential_students')
  const appliedFilters = useSelector((state: RootState) => state.potentialStudent.appliedFilters) as any

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const resolvePotentialStudentId = (row: any): number | null => {
    const raw = row?.id ?? row?.potential_student_id ?? row?.student_id
    const id = Number(raw)

    return Number.isFinite(id) && id > 0 ? id : null
  }

  const columns = [
    {
      flex: 0.25,
      minWidth: 180,
      field: 'name',
      headerName: t('Name'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {params.row?.name ?? ''} {params.row?.surname ?? ''}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.15,
      minWidth: 110,
      field: 'dni',
      headerName: t('Nif'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant='body2'>{params.row?.dni ?? ''}</Typography>
        </Box>
      )
    },
    {
      flex: 0.15,
      minWidth: 110,
      field: 'telephone',
      headerName: t('Telephone'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant='body2'>{params.row?.telephone ?? ''}</Typography>
        </Box>
      )
    },
    {
      flex: 0.2,
      minWidth: 180,
      field: 'email',
      headerName: t('Email'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant='body2'>{params.row?.email ?? ''}</Typography>
        </Box>
      )
    },
    {
      flex: 0.2,
      minWidth: 170,
      field: 'company',
      headerName: t('Company'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant='body2'>
            {params.row?.company?.name ?? params.row?.company_name ?? params.row?.company ?? ''}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.12,
      minWidth: 100,
      field: 'status',
      headerName: t('Status'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const active = Number(params.row?.active ?? 1) === 1

        return <Chip label={active ? t('Active') : t('Inactive')} color={active ? 'success' : 'error'} size='small' />
      }
    },
    {
      flex: 0.13,
      field: 'actions',
      minWidth: 90,
      headerName: t('Actions'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {canUpdate && (
            <Tooltip title={t('Edit')} placement='top'>
              <IconButton
                onClick={e => {
                  e.stopPropagation()
                  blurActiveElement()
                  const id = resolvePotentialStudentId(params.row)
                  if (!id) return
                  dispatch(potentialStudentActions.openModal({ mode: 'edit', studentId: id }))
                }}
              >
                <Icon icon='tabler:pencil' fontSize={20} />
              </IconButton>
            </Tooltip>
          )}
          {canEliminate && (
            <Tooltip title={t('Eliminate')} placement='top'>
              <IconButton
                onClick={e => {
                  e.stopPropagation()
                  blurActiveElement()
                  const id = resolvePotentialStudentId(params.row)
                  if (!id) return
                  dispatch(potentialStudentActions.setId(id))
                  dispatch(potentialStudentActions.setShowEliminateDialog(true))
                }}
              >
                <Icon icon='tabler:trash' fontSize={20} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ]

  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('asc')
  const [rows, setRows] = useState<any[]>([])
  const [sortColumn, setSortColumn] = useState<string>('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [loading, setLoading] = useState<boolean>(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getPotentialStudents({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.potential_students ?? res.data?.data?.students ?? res.data?.data?.data ?? [])
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, sort, sortColumn, appliedFilters])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData, filterButtonClickCount])

  const handleSortModel = (model: GridSortModel) => {
    if (!model.length) {
      setSort('asc')
      setSortColumn('name')

      return
    }

    setSort(model[0].sort ?? 'asc')
    setSortColumn(model[0].field)
  }

  return (
    <Fragment>
      <Card>
        <CardContent>
          <Box>
            <DataGrid
              onRowClick={params => {
                blurActiveElement()
                const id = resolvePotentialStudentId(params.row)
                if (!id) return
                dispatch(potentialStudentActions.openModal({ mode: 'view', studentId: id }))
              }}
              disableColumnFilter
              pagination
              autoHeight
              rows={rows}
              getRowId={row => row?.id ?? row?.potential_student_id ?? row?.student_id}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              sortingOrder={['asc', 'desc']}
              sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
              paginationMode='server'
              pageSizeOptions={[25, 50, 100]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              onPaginationModelChange={setPaginationModel}
            />
          </Box>
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default PotentialStudentsTable
