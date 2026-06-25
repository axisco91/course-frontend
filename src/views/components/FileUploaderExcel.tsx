import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'

interface FileUploaderSingleProps {
  onFileSelect: (file: File) => void
}

const FileUploaderExcel: React.FC<FileUploaderSingleProps> = ({ onFileSelect }) => {
  // Traducciones
  const { t } = useTranslation()

  // ** State
  const [file, setFile] = useState<File | null>(null)

  // ** Hooks
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: (acceptedFiles: File[]) => {
      setFile(acceptedFiles[0])
    }
  })

  const handleFileSelect = (acceptedFiles: File) => {
    const selectedFile = acceptedFiles
    setFile(selectedFile)
    onFileSelect(selectedFile)
  }

  useEffect(() => {
    if (file) {
      handleFileSelect(file)
    }
  }, [file])

  return (
    <Box {...getRootProps({ className: 'dropzone' })} sx={{ height: 250 }}>
      <input {...getInputProps()} />
      {file ? (
        <Typography key={file.name}>{file.name}</Typography>
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
    </Box>
  )
}

export default FileUploaderExcel
