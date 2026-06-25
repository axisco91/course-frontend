import React, { Fragment, ReactElement, Ref, forwardRef, useEffect, useState } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  Fade,
  FadeProps,
  IconButton,
  IconButtonProps,
  Typography,
  styled
} from '@mui/material'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import Style from 'ol/style/Style'
import OlIcon from 'ol/style/Icon'
import { fromLonLat } from 'ol/proj'
import 'ol/ol.css'
import { useTranslation } from 'react-i18next'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getAddressFromCoordinates } from 'src/api/externalApi'

// Para los dialogs
const Transition = forwardRef(function Transition(
  props: FadeProps & { children?: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Fade ref={ref} {...props} />
})

const CustomCloseButton = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  top: 0,
  right: 0,
  color: 'grey.500',
  position: 'absolute',
  boxShadow: theme.shadows[2],
  transform: 'translate(10px, -10px)',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: `${theme.palette.background.paper} !important`,
  transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
  '&:hover': {
    transform: 'translate(7px, -5px)'
  }
}))

interface SaveProps {
  onClose: () => void
  coordinates: string
  title: string
}

const MapViewerDialog: React.FC<SaveProps> = ({ onClose, coordinates, title }) => {
  const { t } = useTranslation()
  const [map, setMap] = useState<Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [rerenderTrigger, setRerenderTrigger] = useState('')
  const [first, setFirst] = useState(true)
  const [address, setAddress] = useState<string>('')

  const handleCloseDialog = () => {
    onClose()
  }

  useEffect(() => {
    if (first) {
      if (rerenderTrigger) {
        setFirst(false)
      }
      try {
        // Obtenemos longitud y latitud
        const [latString, lonString] = coordinates.split('/')

        // Creamos el mapa
        const newMap = new Map({
          target: 'map',
          layers: [new TileLayer({ source: new OSM() })],
          view: new View({
            center: fromLonLat([parseFloat(lonString), parseFloat(latString)]),
            zoom: 17
          })
        })

        // Obtenemos la dirección
        const fetchAddress = async () => {
          const result = await getAddressFromCoordinates(latString, lonString)
          setAddress(result || 'Address not found')
        }

        fetchAddress()

        // Creamos y añadimos el icono
        const marker = new Feature({
          geometry: new Point(fromLonLat([parseFloat(lonString), parseFloat(latString)]))
        })

        const svgIconSrc =
          'data:image/svg+xml;charset=utf-8,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-map-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" /></svg>'
          )

        marker.setStyle(
          new Style({
            image: new OlIcon({
              crossOrigin: 'anonymous',
              src: svgIconSrc,
              size: [24, 24],
              scale: 1 // Adjust scale as needed
            })
          })
        )

        const vectorSource = new VectorSource({
          features: [marker]
        })

        const markerVectorLayer = new VectorLayer({
          source: vectorSource
        })

        newMap.addLayer(markerVectorLayer)

        setMap(newMap)
        setLoading(false)
        triggerRerender()
      } catch (error) {
        console.error('Error fetching location:', error)
        setError(error)
        setLoading(false)
      }
    }
  }, [coordinates, rerenderTrigger])

  // Function to trigger re-render
  const triggerRerender = () => {
    setRerenderTrigger(Math.random().toString())
  }

  return (
    <Fragment>
      <Dialog
        fullWidth
        open={true}
        maxWidth='xl'
        scroll='body'
        onClose={handleCloseDialog}
        TransitionComponent={Transition}
        onBackdropClick={handleCloseDialog}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogContent
          sx={{
            pb: theme => `${theme.spacing(8)} !important`,
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <CustomCloseButton onClick={handleCloseDialog}>
            <Icon icon='tabler:x' fontSize='1.25rem' />
          </CustomCloseButton>
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant='h3' sx={{ mb: 3 }}>
              {t('Map')}: {title}
            </Typography>
            {loading && <div>{t('Loading map')}...</div>}
            {error && <div>Error: {error.message}</div>}
            {map && (
              <Box p={2}>
                <div id='map' style={{ width: '100%', height: '400px' }}></div>
              </Box>
            )}
            {!loading && address && (
              <Typography variant='h6' sx={{ mb: 2 }}>
                📍 {address}
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Fragment>
  )
}

export default MapViewerDialog
