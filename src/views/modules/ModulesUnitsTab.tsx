import { Box, Button, CardContent, IconButton, Tooltip } from '@mui/material'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { DataGrid, GridRenderCellParams } from 'src/views/components/DataGrid'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import { addModuleUnit, getModuleUnitNotUsed, getModuleUnits, removeModuleUnit } from 'src/api/api'
import { AuthContext } from 'src/context/AuthContext'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import DeleteElement from 'src/views/components/DeleteElement'
import SavingDialog from 'src/views/components/SavingDialog'

type Option = {
  id: number
  name: string
}

interface ModulesUnitsTabProps {
  open: boolean
  moduleId: number | null
  readOnly: boolean
}

const toArray = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (raw && typeof raw === 'object') return Object.values(raw)

  return []
}

const isUnitLike = (value: any) => {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return false

  const nested = value?.training_unit ?? value?.unit ?? null

  return (
    value?.id !== undefined ||
    value?.training_unit_id !== undefined ||
    value?.name !== undefined ||
    value?.formative_unit !== undefined ||
    value?.code !== undefined ||
    nested?.id !== undefined ||
    nested?.name !== undefined
  )
}

const findUnitsArrayDeep = (raw: any): any[] | null => {
  if (raw == null) return null

  if (Array.isArray(raw)) {
    if (raw.length === 0) return raw
    if (raw.some(item => isUnitLike(item))) return raw

    for (const item of raw) {
      const found = findUnitsArrayDeep(item)
      if (found) return found
    }

    return null
  }

  if (typeof raw !== 'object') return null

  const priorityKeys = ['units', 'training_units', 'module_units', 'not_used_units', 'notUsedUnits', 'data', 'result']
  for (const key of priorityKeys) {
    if (key in raw) {
      const found = findUnitsArrayDeep(raw[key])
      if (found) return found
    }
  }

  for (const value of Object.values(raw)) {
    const found = findUnitsArrayDeep(value)
    if (found) return found
  }

  return null
}

const extractUnitsArray = (payload: any): any[] => {
  const directCandidates = [
    payload?.data?.units,
    payload?.units,
    payload?.data?.training_units,
    payload?.training_units,
    payload?.data?.module_units,
    payload?.module_units,
    payload?.data?.not_used_units,
    payload?.not_used_units,
    payload?.data?.data,
    payload?.data,
    payload
  ]

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate) && (candidate.length === 0 || candidate.some(item => isUnitLike(item)))) {
      return candidate
    }
  }

  return findUnitsArrayDeep(payload) ?? []
}

const toOptions = (raw: any): Option[] => {
  return toArray(raw)
    .map((item: any) => {
      const unitData = item?.training_unit ?? item?.unit ?? item
      const id = Number(unitData?.id ?? item?.id ?? item?.value ?? item?.training_unit_id ?? 0)
      const name = String(
        unitData?.name ??
          item?.name ??
          item?.label ??
          item?.unit ??
          item?.training_unit_name ??
          unitData?.formative_unit ??
          item?.formative_unit ??
          item?.description ??
          ''
      ).trim()

      if (!id || !name) return null

      return { id, name }
    })
    .filter(Boolean) as Option[]
}

const getRowDeleteId = (row: any) => {
  const candidates = [
    row?.module_unit_id,
    row?.module_unit?.id,
    row?.pivot_id,
    row?.module_training_unit_id,
    row?.id,
    row?.training_unit_id
  ]

  for (const value of candidates) {
    const parsed = Number(value)
    if (!Number.isNaN(parsed) && parsed > 0) return parsed
  }

  return null
}

const mapUnitLabel = (row: any) => {
  const unitData = row?.training_unit ?? row?.unit ?? null
  const code = String(unitData?.formative_unit ?? row?.formative_unit ?? unitData?.code ?? row?.unit_code ?? row?.code ?? '').trim()
  const name = String(unitData?.name ?? row?.name ?? row?.training_unit_name ?? row?.unit ?? '').trim()

  return [code, name].filter(Boolean).join(' - ') || '-'
}

const ModulesUnitsTab = ({ open, moduleId, readOnly }: ModulesUnitsTabProps) => {
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [notUsedUnits, setNotUsedUnits] = useState<Option[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Option | null>(null)
  const [deleteRow, setDeleteRow] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const fetchData = useCallback(async () => {
    if (!moduleId) return

    setLoading(true)
    try {
      const [unitsRes, notUsedRes] = await Promise.all([getModuleUnits(moduleId), getModuleUnitNotUsed(moduleId)])

      const unitsData = extractUnitsArray(unitsRes.data)
      const notUsedData = extractUnitsArray(notUsedRes.data)

      setRows(toArray(unitsData))
      setNotUsedUnits(toOptions(notUsedData))
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [moduleId])

  useEffect(() => {
    if (!open || !moduleId) return
    fetchData()
  }, [open, moduleId, fetchData])

  const handleAddUnit = async () => {
    if (!moduleId || !selectedUnit) return

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('module_id', String(moduleId))
      formData.append('training_unit_id', String(selectedUnit.id))
      formData.append('unit_id', String(selectedUnit.id))

      const response = await addModuleUnit(formData)

      if (response.data?.success || response.status === 200) {
        toast.success(response.data?.message ?? 'Unidad añadida')
        setSelectedUnit(null)
        await fetchData()
      } else {
        toast.error(response.data?.message ?? 'No se pudo añadir la unidad')
      }
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirmDelete = async () => {
    const id = getRowDeleteId(deleteRow)
    if (!id) return

    setProcessing(true)
    try {
      const response = await removeModuleUnit(id)

      if (response.data?.success || response.status === 200) {
        toast.success(response.data?.message ?? 'Unidad eliminada')
        await fetchData()
      } else {
        toast.error(response.data?.message ?? 'No se pudo eliminar la unidad')
      }
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setProcessing(false)
      setDeleteRow(null)
    }
  }

  const columns = useMemo(
    () => [
      {
        flex: 0.85,
        minWidth: 420,
        field: 'name',
        headerName: 'UNIDAD',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {mapUnitLabel(params.row)}
          </Typography>
        )
      },
      {
        flex: 0.15,
        minWidth: 120,
        field: 'actions',
        headerName: 'ACCIONES',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Tooltip title='Eliminar' placement='top'>
              <span>
                <IconButton
                  size='small'
                  disabled={readOnly}
                  onClick={e => {
                    e.stopPropagation()
                    setDeleteRow(params.row)
                  }}
                >
                  <Icon icon='tabler:trash' fontSize={20} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )
      }
    ],
    [readOnly]
  )

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ mb: 4 }}>
            {!readOnly && (
              <Button variant='contained' onClick={() => setShowForm(prev => !prev)}>
                {showForm ? 'Cerrar' : 'Añadir Unidad'}
              </Button>
            )}
          </Box>

          {showForm && !readOnly && (
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 6 }}>
              <Box sx={{ flex: 1 }}>
                <Autocomplete
                  options={notUsedUnits}
                  value={selectedUnit}
                  onChange={(_, option) => setSelectedUnit(option)}
                  getOptionLabel={option => option?.name ?? ''}
                  isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                  disabled={readOnly || loading || processing}
                  renderInput={params => (
                    <CustomTextField {...params} fullWidth label='Unidades Formativas' placeholder='Selecciona...' />
                  )}
                />
              </Box>

              <Button
                variant='contained'
                disabled={readOnly || !selectedUnit || loading || processing}
                onClick={handleAddUnit}
              >
                Añadir
              </Button>
            </Box>
          )}

          <DataGrid
            disableRowSelectionOnClick
            disableColumnFilter
            pagination
            autoHeight
            rows={rows}
            columns={columns as any}
            getRowId={row => row.module_unit_id ?? row.id ?? row.training_unit_id ?? row?.training_unit?.id ?? row?.unit?.id ?? row.value}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                  page: 0
                }
              }
            }}
          />
        </CardContent>
      </Card>

      {deleteRow && <DeleteElement onDelete={handleConfirmDelete} onClose={() => setDeleteRow(null)} />}

      {!processing && loading && <SavingDialog labelKey='Processing Data' />}

      {processing && <SavingDialog />}
    </>
  )
}

export default ModulesUnitsTab
