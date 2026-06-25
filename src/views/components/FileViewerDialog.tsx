// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import { Dialog, DialogContent, Fade, FadeProps } from '@mui/material'

// Para los dialogs
const Transition = forwardRef(function Transition(
  props: FadeProps & { children?: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Fade ref={ref} {...props} />
})

interface SaveProps {
  onClose: () => void
  url: string
}

const FileViewerDialog: React.FC<SaveProps> = ({ onClose, url }) => {
  const handleCloseDialog = () => {
    onClose()
  }

  const getFileType = (url: string): string => {
    // Use regular expression to extract the file extension from the URL
    const extensionMatch = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i)

    if (extensionMatch) {
      const extension = extensionMatch[1]
      
return extension.toLowerCase() // Convert to lowercase for consistency
    } else {
      console.error('Unable to determine file extension from URL:', url)
      
return 'pdf' // Default to PDF if no extension found
    }
  }

  const fileType = getFileType(url)

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
          <Box p={2}>
            {fileType === 'pdf' ? (
              <iframe src={url} width='100%' height='500px' title='PDF Viewer' />
            ) : (
              <img src={url} alt='File' style={{ maxWidth: '100%', maxHeight: '500px' }} />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Fragment>
  )
}

export default FileViewerDialog
