import { Box, Button, CardContent, Grid, IconButton, Tooltip } from '@mui/material'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { DataGrid, GridRenderCellParams } from 'src/views/components/DataGrid'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import {
  createCertificationElements,
  deleteCertificationElements,
  getCertificationElementModules,
  getCertificationElementUnits,
  getCertificationElements
} from 'src/api/api'
import { AuthContext } from 'src/context/AuthContext'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import DeleteElement from 'src/views/components/DeleteElement'
import SavingDialog from 'src/views/components/SavingDialog'

type Option = {
  id: number
  name: string
}

interface CertificationsElementsTabProps {
  open: boolean
  certificationId: number | null
  readOnly: boolean
}

const toArray = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (raw && typeof raw === 'object') return Object.values(raw)

  return []
}

const toOptions = (raw: any): Option[] => {
  return toArray(raw)
    .map((item: any) => {
      const id = Number(item?.id ?? item?.value ?? 0)
      const name = String(
        item?.name ??
          item?.label ??
          item?.module ??
          item?.unit ??
          item?.element ??
          item?.title ??
          item?.description ??
          ''
      ).trim()

      if (!id || !name) return null

      return { id, name }
    })
    .filter(Boolean) as Option[]
}

const CertificationsElementsTab = ({ open, certificationId, readOnly }: CertificationsElementsTabProps) => {
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  const [elements, setElements] = useState<any[]>([])
  const [modules, setModules] = useState<Option[]>([])
  const [units, setUnits] = useState<Option[]>([])

  const [selectedModule, setSelectedModule] = useState<Option | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Option | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const fetchData = useCallback(async () => {
    if (!certificationId) return

    setLoading(true)
    try {
      const [elementsRes, unitsRes, modulesRes] = await Promise.all([
        getCertificationElements(certificationId),
        getCertificationElementUnits(certificationId),
        getCertificationElementModules(certificationId)
      ])

      const elementsData =
        elementsRes.data?.elements ??
        elementsRes.data?.data?.elements ??
        elementsRes.data?.data?.certification_elements ??
        elementsRes.data?.data?.data ??
        elementsRes.data?.data ??
        []

      const unitsData = unitsRes.data?.data?.units ?? unitsRes.data?.units ?? unitsRes.data?.data?.data ?? unitsRes.data?.data ?? []

      const modulesData =
        modulesRes.data?.data?.modules ?? modulesRes.data?.modules ?? modulesRes.data?.data?.data ?? modulesRes.data?.data ?? []
      
      const normalizedUnitsData =
        unitsRes.data?.data?.units ??
        unitsRes.data?.units ??
        unitsRes.data?.data?.training_units ??
        unitsRes.data?.training_units ??
        unitsRes.data?.data?.data ??
        unitsRes.data?.data ??
        unitsRes.data ??
        unitsData

      const normalizedModulesData =
        modulesRes.data?.data?.modules ??
        modulesRes.data?.modules ??
        modulesRes.data?.data?.certification_modules ??
        modulesRes.data?.certification_modules ??
        modulesRes.data?.data?.data ??
        modulesRes.data?.data ??
        modulesRes.data ??
        modulesData

      setElements(toArray(elementsData))
      setUnits(toOptions(normalizedUnitsData))
      setModules(toOptions(normalizedModulesData))
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [certificationId])

  useEffect(() => {
    if (!open || !certificationId) return
    fetchData()
  }, [open, certificationId, fetchData])

  const addElement = async (id: number, type: 'module_id' | 'training_unit_id') => {
    if (!certificationId) return

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('certification_id', String(certificationId))
      formData.append('id', String(id))
      formData.append('type', type)

      const response = await createCertificationElements(formData)

      if (response.data?.success || response.status === 200) {
        toast.success(response.data?.message ?? 'Elemento añadido')
        await fetchData()
      } else {
        toast.error(response.data?.message ?? 'No se pudo añadir el elemento')
      }
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setProcessing(false)
      setSelectedModule(null)
      setSelectedUnit(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    setProcessing(true)
    try {
      const response = await deleteCertificationElements(deleteId)
      if (response.data?.success || response.status === 200) {
        toast.success(response.data?.message ?? 'Elemento eliminado')
        await fetchData()
      } else {
        toast.error(response.data?.message ?? 'No se pudo eliminar el elemento')
      }
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setProcessing(false)
      setDeleteId(null)
    }
  }

  const columns = useMemo(
    () => [
      {
        flex: 0.85,
        minWidth: 420,
        field: 'name',
        headerName: 'NOMBRE',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const formativeAction = String(params.row?.formative_action ?? '').trim()
          const element = String(params.row?.element ?? params.row?.name ?? '').trim()

          return (
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
              {[formativeAction, element].filter(Boolean).join(' ') || '-'}
            </Typography>
          )
        }
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
                    const id = Number(params.row?.id)
                    if (id) setDeleteId(id)
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
          <Grid container spacing={5}>
            <Grid item xs={12} md={5}>
              <Autocomplete
                options={modules}
                value={selectedModule}
                onChange={(_, option) => setSelectedModule(option)}
                getOptionLabel={option => option?.name ?? ''}
                isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                disabled={readOnly || loading || processing}
                renderInput={params => <CustomTextField {...params} fullWidth label='Módulos' placeholder='Selecciona...' />}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant='contained'
                disabled={readOnly || !selectedModule || loading || processing}
                onClick={() => {
                  if (selectedModule) addElement(selectedModule.id, 'module_id')
                }}
              >
                Añadir
              </Button>
            </Grid>

            <Grid item xs={12} md={5}>
              <Autocomplete
                options={units}
                value={selectedUnit}
                onChange={(_, option) => setSelectedUnit(option)}
                getOptionLabel={option => option?.name ?? ''}
                isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                disabled={readOnly || loading || processing}
                renderInput={params => <CustomTextField {...params} fullWidth label='Unidades' placeholder='Selecciona...' />}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant='contained'
                disabled={readOnly || !selectedUnit || loading || processing}
                onClick={() => {
                  if (selectedUnit) addElement(selectedUnit.id, 'training_unit_id')
                }}
              >
                Añadir
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 6 }}>
            <DataGrid
              disableRowSelectionOnClick
              disableColumnFilter
              pagination
              autoHeight
              rows={elements}
              columns={columns as any}
              getRowId={row => row.id ?? row.value}
              loading={loading}
              pageSizeOptions={[25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 25,
                    page: 0
                  }
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {deleteId && <DeleteElement onDelete={handleConfirmDelete} onClose={() => setDeleteId(null)} />}

      {!processing && loading && <SavingDialog labelKey='Processing Data' />}

      {processing && <SavingDialog />}
    </>
  )
}

export default CertificationsElementsTab
