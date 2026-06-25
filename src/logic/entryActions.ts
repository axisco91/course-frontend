// src/logic/entryActions.ts
import { storeEntry, validateEntry } from 'src/api/api'

export type SaveParams = {
  companyId: number
  contractId: number
  pin: string | number
  motiveId: number
  localIp?: string
  minutes?: number
  projectId?: number | null
  subProjectId?: number | null
  serviceId?: number | null
  geolocationEnabled?: boolean
  captureEnabled?: boolean
}

export type SaveCallbacks = {
  onSuccess?: (data: any) => void
  onError?: (e: any) => void
}

type ValidationData = {
  correct?: boolean
  message?: string
  motive?: string
  personalized_shift?: number
}

/** Geolocalización rápida y no bloqueante (opcional) */
async function getQuickPosition(): Promise<{
  lat: number
  lng: number
  accuracy?: number
  method?: string
} | null> {
  if (!window.isSecureContext || !('geolocation' in navigator)) return null
  try {
    return await new Promise(resolve => {
      let settled = false
      const t = setTimeout(() => {
        if (!settled) {
          settled = true
          resolve(null)
        }
      }, 1200)

      navigator.geolocation.getCurrentPosition(
        pos => {
          if (settled) return
          settled = true
          clearTimeout(t)
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            method: 'geo_quick'
          })
        },
        () => {
          if (settled) return
          settled = true
          clearTimeout(t)
          resolve(null)
        },
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 1200 }
      )
    })
  } catch {
    return null
  }
}

/** Captura 1 frame de la cámara (opcional) */
async function getSnapshot(): Promise<Blob | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    const video = document.createElement('video')
    video.srcObject = stream
    await new Promise(res => (video.onloadedmetadata = res))
    await video.play()

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg'))
    stream.getTracks().forEach(t => t.stop())

    return blob
  } catch {
    return null
  }
}

/** Solo validar — util para flujos con diálogos (p.ej. pedir minutos) */
export async function validateOnly(params: {
  companyId: number
  contractId: number
  pin: string | number
  motiveId: number
}) {
  const { companyId, contractId, pin, motiveId } = params
  const v = await validateEntry({
    company_id: companyId,
    pin,
    contract_id: contractId,
    entry_motive_id: String(motiveId)
  })

  return (v?.data?.data ?? {}) as ValidationData
}

/** Solo guardar (reutilizable en consola rápida y formulario) */
export async function saveEntry(params: SaveParams, { onSuccess, onError }: SaveCallbacks = {}) {
  const {
    companyId,
    contractId,
    pin,
    motiveId,
    localIp,
    minutes,
    projectId,
    subProjectId,
    serviceId,
    geolocationEnabled,
    captureEnabled
  } = params

  const formData = new FormData()
  formData.append('company_id', String(companyId))
  formData.append('contract_id', String(contractId))
  formData.append('pin', String(pin))
  formData.append('entry_motive_id', String(motiveId))
  if (localIp) formData.append('local_ip', localIp)
  if (minutes) formData.append('minutes', String(minutes))
  if (projectId) formData.append('project_id', String(projectId))
  if (subProjectId) formData.append('subproject_id', String(subProjectId))
  if (serviceId) formData.append('service_id', String(serviceId))

  if (geolocationEnabled) {
    const pos = await getQuickPosition()
    if (pos) {
      formData.append('coordinates', `${pos.lat}/${pos.lng}`)
      if (pos.accuracy != null) formData.append('accuracy_m', String(Math.round(pos.accuracy)))
      if (pos.method) formData.append('loc_method', pos.method)
    } else {
      formData.append('loc_status', 'none_fast')
    }
  }

  if (captureEnabled) {
    const photo = await getSnapshot()
    if (photo) formData.append('photo', photo, 'photo.jpg')
  }

  try {
    const res = await storeEntry(formData)
    onSuccess?.(res.data)

    return res.data
  } catch (e) {
    onError?.(e)
    throw e
  }
}

/** Valida y luego guarda; si no es correcto:
 * - force=true → guarda igual (ideal para “consola rápida”)
 * - force=false → dispara onInvalid para que la UI decida (mostrar diálogo)
 */
export async function validateAndSave(
  params: SaveParams & { force?: boolean },
  {
    onInvalid,
    onSuccess,
    onError
  }: SaveCallbacks & { onInvalid?: (payload: { message: string; motive: string; data?: ValidationData }) => void } = {}
) {
  const { companyId, contractId, pin, motiveId, force } = params

  try {
    const data = await validateOnly({ companyId, contractId, pin, motiveId })

    if (data.correct || force) {
      return await saveEntry(params, { onSuccess, onError })
    } else {
      onInvalid?.({ message: data.message ?? 'Invalid entry', motive: data.motive ?? '', data })

      return null
    }
  } catch (e) {
    if (force) {
      return await saveEntry(params, { onSuccess, onError })
    }
    onError?.(e)
    throw e
  }
}

/** Utilidad: resolver motiveId por alias */
export function motiveIdByAlias(motives: any[], alias?: string): number | null {
  if (!alias) return null
  const m = motives?.find((mm: any) => mm.alias === alias)

  return m ? m.id : null
}
