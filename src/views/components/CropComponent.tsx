import React, { useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface DialogComponentProps {
  open: boolean
  handleClose: () => void
  imgSrc: string
  handleSave: (croppedImage: string) => void // Define the handleSave function's parameter type
  aspect: number
}

const CropComponent: React.FC<DialogComponentProps> = ({ open, handleClose, imgSrc, handleSave, aspect }) => {
  const scale = useState(1)
  const rotate = useState(0)
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 30, x: 0, y: 0, height: 0 })
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [isTouched, setIsTouched] = useState(false)

  const handleSaveImage = () => {
    if (completedCrop && imgRef.current) {
      const canvas = document.createElement('canvas')
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height
      const ctx = canvas.getContext('2d')

      if (ctx && completedCrop.width && completedCrop.height) {
        canvas.width = completedCrop.width * scaleX
        canvas.height = completedCrop.height * scaleY

        // Set background color
        ctx.fillStyle = 'white' // Replace 'white' with your desired background color
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw the image
        ctx.drawImage(
          imgRef.current,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY
        )

        const croppedImage = canvas.toDataURL('image/jpeg')
        handleSave(croppedImage) // Call the handleSave function with the cropped image data
      }
    }
    handleClose()
  }

  const onImageLoad = e => {
    setIsTouched(false)
    const { naturalWidth, naturalHeight } = e.target
    if (aspect) {
      const cropWidth = 100 // set the desired width
      const cropHeight = cropWidth / aspect
      const x = 0
      const y = 0

      setCrop({ unit: '%', width: cropWidth, x, y, height: cropHeight })

      // Programmatically trigger the crop action
      const initialCrop = { unit: '%', width: cropWidth, x, y, height: cropHeight / 2 } // Adjust the crop box position
      setCompletedCrop(initialCrop)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Crop Image</DialogTitle>
      <DialogContent>
        <div>
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => {
                setCrop(percentCrop)
                setIsTouched(true)
              }}
              onComplete={c => setCompletedCrop(c)}
              aspect={aspect}
              minHeight={200}
            >
              <img
                ref={imgRef}
                alt='Crop me'
                src={imgSrc}
                style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSaveImage} disabled={!isTouched}>
          Save
        </Button>{' '}
        {/* Call handleSaveImage on Save button click */}
      </DialogActions>
    </Dialog>
  )
}

export default CropComponent
