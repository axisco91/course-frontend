// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import { Dialog, DialogActions, DialogContent, Fade, FadeProps, Grid, Typography } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'

interface FileProp {
  name: string
  type: string
  size: number
}

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
  onSave: (file: File) => void
}

const FileUploaderImagePdfDialog: React.FC<SaveProps> = ({ onClose, onSave }) => {
  // Para el idioma
  const { t } = useTranslation()
  const [showError, setShowError] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  // ** Hooks
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    onDrop: (acceptedFiles: File[]) => {
      // Filter out files with invalid types
      const filteredFiles = acceptedFiles.filter(file => {
        const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'application/pdf']

        return acceptedTypes.includes(file.type)
      })

      // Set the filtered files
      setFiles(filteredFiles)
    }
  })

  // Mostramos imagen o icono si es un pdf
  const img = files.map((file: FileProp) => {
    // Check if the file type is PDF
    if (file.type === 'application/pdf') {
      return (
        <Box key={file.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Render PDF icon here */}
          <Icon icon='tabler:file-pdf' fontSize='3rem' color='primary' />
          <Typography variant='body2' sx={{ ml: 1 }}>
            {file.name}
          </Typography>
        </Box>
      )
    } else {
      // Render image
      return (
        <img
          key={file.name}
          alt={file.name}
          className='single-file-image'
          src={URL.createObjectURL(file as any)}
          style={{ maxWidth: '150px', maxHeight: '100%', width: 'auto', height: 'auto' }}
        />
      )
    }
  })

  const handleClearFiles = () => {
    setFiles([])
  }

  const handleCloseDialog = () => {
    onClose()
  }

  const handleSelect = () => {
    if (files[0]) {
      setShowError(false)
      onSave(files[0])
    } else {
      setShowError(true)
    }
  }

  return (
    <Fragment>
      <Dialog
        fullWidth
        open={true}
        maxWidth='md'
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
          {files.length > 0 && (
            <Button variant='outlined' color='error' onClick={handleClearFiles} sx={{ mt: 2 }}>
              <Icon icon='tabler:eraser' fontSize='1.25rem' />
              {t('Clear Loaded File')}
            </Button>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Grid container spacing={5} sx={{ marginBottom: '5px' }}>
            <Grid item sm={12}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h3' sx={{ mb: 3 }}>
                  {t('Add File')}
                </Typography>
              </Box>
            </Grid>
            <Grid item sm={12}>
              <Box
                {...getRootProps({ className: 'dropzone' })}
                sx={{
                  ...(files.length ? { height: 450 } : {}),
                  border: '2px dashed #ccc', // Add border style here
                  borderRadius: '8px', // Add border radius if needed
                  padding: '10px'
                }}
              >
                <input {...getInputProps()} />
                {files.length ? (
                  img
                ) : (
                  <Box sx={{ display: 'flex', textAlign: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <Box
                      sx={{
                        mb: 8.75,
                        width: 48,
                        height: 48,
                        display: 'flex',
                        borderRadius: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.08)`
                      }}
                    >
                      <Icon icon='tabler:upload' fontSize='1.75rem' />
                    </Box>
                    <Typography variant='h4' sx={{ mb: 2.5 }}>
                      {t('Drop files here or click to upload.')}
                    </Typography>
                  </Box>
                )}
                {showError && (
                  <Typography variant='h4' color='error' sx={{ textAlign: 'center' }}>
                    {t('File required')}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item sm={12}>
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <Button variant='contained' onClick={() => handleSelect()} sx={{ mr: 4 }}>
                  {t('Save')}
                </Button>
                <Button variant='tonal' color='secondary' onClick={handleCloseDialog}>
                  {t('Cancel')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default FileUploaderImagePdfDialog
