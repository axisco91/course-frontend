// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import { Button, Dialog, DialogActions, DialogContent, Fade, FadeProps, Grid } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'
import CustomTextField from 'src/@core/components/mui/text-field'

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

interface CommentDialogProps {
  onClose: () => void
  title: string
  text: string
  comment: string
  onSave?: (comment: string) => void
  disabled?: boolean
  minLines: number
  maxLines: number
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  onClose,
  title,
  text,
  comment,
  onSave,
  disabled,
  minLines,
  maxLines
}) => {
  // Para el idioma
  const { t } = useTranslation()
  const [newComment, setNewComment] = useState(comment)
  const [saving, setSaving] = useState(false)

  const handleCloseDialog = () => {
    onClose()
  }

  const handleSaveComment = () => {
    if (onSave) {
      onSave(newComment)
      setSaving(true)
    }
  }

  return (
    <Fragment>
      <Dialog
        fullWidth
        open={true}
        maxWidth='sm'
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
              {title}
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>{text}</Typography>
          </Box>
          <Grid container>
            <Grid item xs={12} sm={12}>
              <CustomTextField
                fullWidth
                value={newComment}
                label={t('Comment')}
                placeholder={t('Comment')}
                disabled={disabled}
                onChange={e => setNewComment(e.target.value)}
                multiline
                minRows={minLines}
                maxRows={maxLines}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          {disabled ? (
            ''
          ) : (
            <Button variant='tonal' color='primary' onClick={handleSaveComment} disabled={saving}>
              {t('Save')}
            </Button>
          )}
          <Button variant='tonal' color='secondary' onClick={handleCloseDialog}>
            {t('Cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default CommentDialog
