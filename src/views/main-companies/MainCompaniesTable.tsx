import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { Avatar, CardContent, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'

import Icon from 'src/@core/components/icon'
import { editMainCompany, getMainCompanies, getMainCompany } from 'src/api/api'
import { AuthContext } from 'src/context/AuthContext'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { mainCompanyActions } from 'src/reducers/management/MainCompanyReducer'
import { RootState } from 'src/reducers/types/types'
import LoadingDialog from 'src/views/components/LoadingDialog'

type SortType = 'asc' | 'desc' | undefined | null

const hasAny = (permissions: string[], needed: string[]) => needed.some(p => permissions.includes(p))

const isActiveValue = (value: any) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1

  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()

  return normalized === '1' || normalized === 'true' || normalized === 'active' || normalized === 'activo'
}

const toAbsoluteAssetUrl = (asset: string | null | undefined) => {
  if (!asset) return ''

  const value = String(asset).trim()
  if (!value) return ''

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value
  }

  if (value.startsWith('/images/')) return value

  const backendFromEnv = process.env.NEXT_PUBLIC_ASSET_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''
  const apiOrigin = backendFromEnv.replace(/\/$/, '')

  const cleanedValue = value.replace(/^\//, '')
  const isStoragePath = cleanedValue.startsWith('storage/')
  const isPublicStoragePath = cleanedValue.startsWith('public/storage/')
  const forceStoragePrefix = process.env.NEXT_PUBLIC_FORCE_STORAGE_PREFIX !== 'false'

  const normalizedPath = isPublicStoragePath
    ? `/storage/${cleanedValue.replace(/^public\/storage\//, '')}`
    : isStoragePath || forceStoragePrefix
    ? `/storage/${cleanedValue.replace(/^storage\//, '')}`
    : `/${cleanedValue}`

  return apiOrigin ? `${apiOrigin}${normalizedPath}` : normalizedPath
}

const MainCompaniesTable = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const appliedFilters = useSelector((state: RootState) => ((state as any).mainCompany?.appliedFilters ?? {}) as any)

  const userPermissions = useSelector((state: RootState) => state.auth.permissions) as string[]
  const canUpdate = Array.isArray(userPermissions)
    ? hasAny(userPermissions, ['edit.main_companies', 'edit.management'])
    : false
  const canEliminate = Array.isArray(userPermissions)
    ? hasAny(userPermissions, ['eliminate.main_companies', 'eliminate.management'])
    : false

  const [togglingId, setTogglingId] = useState<number | null>(null)

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') {
      el.blur()
    }
  }

  const openViewModal = useCallback(
    (row: any) => {
      const id = Number(row?.id)
      if (!id) return

      blurActiveElement()
      dispatch(mainCompanyActions.setSelectedCompany(row))
      dispatch(mainCompanyActions.openModal({ mode: 'view', mainCompanyId: id }))
    },
    [dispatch]
  )

  const handleToggleActive = useCallback(
    async (row: any) => {
      const id = Number(row?.id)
      if (!id || togglingId === id) return

      const nextActive = !isActiveValue(row?.active ?? row?.status)

      setTogglingId(id)
      try {
        const detailRes = await getMainCompany(id)
        const company =
          detailRes.data?.data?.main_company ?? detailRes.data?.data ?? detailRes.data?.main_company ?? row

        const formData = new FormData()
        formData.append('name', company?.name ?? '')
        formData.append('address', company?.address ?? '')
        formData.append('phone', company?.phone ?? company?.telephone ?? '')
        formData.append('email', company?.email ?? '')
        formData.append('url', company?.url ?? '')
        formData.append('title', company?.title ?? '')

        formData.append('primary_color', company?.primary_color ?? '#7367F0')
        formData.append('secondary_color', company?.secondary_color ?? '#A8AAAE')
        formData.append('success_color', company?.success_color ?? '#28C76F')
        formData.append('warning_color', company?.warning_color ?? '#FF9F43')
        formData.append('error_color', company?.error_color ?? '#EA5455')

        formData.append('active', nextActive ? '1' : '0')

        const response = await editMainCompany(id, formData)
        const success = Boolean(response?.data?.success) || response?.status === 200

        if (success) {
          toast.success(nextActive ? 'Empresa activada' : 'Empresa desactivada')
          dispatch(generalActions.addFilterButtonClickCount())
        } else {
          toast.error(response?.data?.message ?? 'No se pudo actualizar el estado')
        }
      } catch (error) {
        handleErrorRef.current(error, logoutRef.current)
      } finally {
        setTogglingId(null)
      }
    },
    [dispatch, togglingId]
  )

  const columns = useMemo(
    () => [
      {
        flex: 0.1,
        minWidth: 90,
        field: 'logo',
        headerName: 'LOGO',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const logoUrl = toAbsoluteAssetUrl(params.row?.logo)
          const fallback =
            String(params.row?.name ?? '?')
              .trim()
              .charAt(0)
              .toUpperCase() || '?'

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Avatar
                variant='rounded'
                src={logoUrl || undefined}
                alt={params.row?.name ?? 'logo'}
                sx={{ width: 38, height: 38 }}
              >
                {fallback}
              </Avatar>
            </Box>
          )
        }
      },
      {
        flex: 0.2,
        minWidth: 210,
        field: 'name',
        headerName: 'NOMBRE',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {params.row?.name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 140,
        field: 'nif',
        headerName: 'CIF',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.nif ?? params.row?.cif ?? ''}</Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 145,
        field: 'phone',
        headerName: 'NÚMERO',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.phone ?? params.row?.telephone ?? ''}</Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 220,
        field: 'email',
        headerName: 'CORREO',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {params.row?.email ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 220,
        field: 'url',
        headerName: 'URL',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const url = String(params.row?.url ?? '').trim()
          if (!url)
            return (
              <Typography noWrap variant='body2'>
                -
              </Typography>
            )

          const href = /^https?:\/\//i.test(url) ? url : `https://${url}`

          return (
            <Typography
              noWrap
              variant='body2'
              component='a'
              href={href}
              target='_blank'
              rel='noreferrer'
              onClick={e => e.stopPropagation()}
              sx={{ color: 'primary.main', textDecoration: 'none' }}
            >
              {url}
            </Typography>
          )
        }
      },
      {
        flex: 0.11,
        minWidth: 130,
        field: 'active',
        headerName: 'ESTADO',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const active = isActiveValue(params.row?.active ?? params.row?.status)

          return (
            <Chip
              size='small'
              label={active ? 'Activo' : 'Inactivo'}
              color={active ? 'success' : 'error'}
              sx={{ fontWeight: 700, minWidth: 90 }}
            />
          )
        }
      },
      {
        flex: 0.16,
        minWidth: 170,
        field: 'actions',
        headerName: 'ACCIONES',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const id = Number(params.row?.id)
          const active = isActiveValue(params.row?.active ?? params.row?.status)
          const isToggling = togglingId === id

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 0.5 }}>
              {canUpdate && (
                <Tooltip title={active ? 'Desactivar' : 'Activar'} placement='top'>
                  <span>
                    <IconButton
                      size='small'
                      disabled={!id || isToggling}
                      onClick={e => {
                        e.stopPropagation()
                        blurActiveElement()
                        handleToggleActive(params.row)
                      }}
                    >
                      <Icon icon={active ? 'tabler:toggle-right' : 'tabler:toggle-left'} fontSize={20} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              {canUpdate && (
                <Tooltip title='Editar' placement='top'>
                  <span>
                    <IconButton
                      size='small'
                      disabled={!id}
                      onClick={e => {
                        e.stopPropagation()
                        blurActiveElement()
                        dispatch(mainCompanyActions.setSelectedCompany(params.row))
                        dispatch(mainCompanyActions.openModal({ mode: 'edit', mainCompanyId: id }))
                      }}
                    >
                      <Icon icon='tabler:pencil' fontSize={20} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              {canEliminate && (
                <Tooltip title='Eliminar' placement='top'>
                  <span>
                    <IconButton
                      size='small'
                      disabled={!id}
                      onClick={e => {
                        e.stopPropagation()
                        blurActiveElement()
                        dispatch(mainCompanyActions.setId(id))
                        dispatch(mainCompanyActions.setShowEliminateDialog(true))
                      }}
                    >
                      <Icon icon='tabler:trash' fontSize={20} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
          )
        }
      }
    ],
    [dispatch, canUpdate, canEliminate, handleToggleActive, togglingId]
  )

  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('asc')
  const [rows, setRows] = useState<any[]>([])
  const [sortColumn, setSortColumn] = useState<string>('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState<boolean>(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getMainCompanies({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      const list = res.data?.data?.main_companies ?? res.data?.data?.companies ?? res.data?.data?.data ?? []
      const rowsList = Array.isArray(list) ? list : []

      setTotal(res.data?.data?.meta?.total ?? rowsList.length)
      setRows(rowsList)

      dispatch(mainCompanyActions.setCompanies(rowsList))
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [dispatch, paginationModel.page, paginationModel.pageSize, sort, sortColumn, appliedFilters])

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
              disableRowSelectionOnClick
              disableColumnFilter
              pagination
              autoHeight
              rows={rows}
              rowCount={total}
              columns={columns as any}
              getRowId={row => row.id ?? row.value}
              sortingMode='server'
              sortingOrder={['asc', 'desc']}
              sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
              paginationMode='server'
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              onPaginationModelChange={setPaginationModel}
              onRowClick={params => openViewModal(params.row)}
              loading={loading}
              sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
            />
          </Box>
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default MainCompaniesTable
