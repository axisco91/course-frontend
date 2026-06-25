import axios from 'axios'
import { format } from 'date-fns'

// Obtener ip publica
const instanceIpify = axios.create({
  baseURL: 'https://api.ipify.org',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

export const getAddressFromCoordinates = async (lat, lon) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        format: 'json',
        lat: lat,
        lon: lon
      },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })

    return response.data.display_name // Returns the address
  } catch (error) {
    console.error('Error fetching address:', error)

    return null
  }
}

/**
 * Llamadas que no son a la plataforma
 */
export const publicIp = data => instanceIpify.get('', { params: data })
