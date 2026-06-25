// ** Type Imports
import { OwnerStateThemeType } from './'
import { Skin } from 'src/@core/layouts/types'

const BACKDROP_CONFIRM_MESSAGE = '¿Quieres salir?\n\nSi tienes cambios sin guardar, se perderán.'

const handleDialogBackdropClickCapture = (event: any) => {
  if (typeof window === 'undefined') return

  const currentTarget = event?.currentTarget as HTMLElement | null
  const target = event?.target as Element | null

  if (!currentTarget || !target) return
  if (currentTarget.dataset.backdropConfirm === 'off') return
  if (!currentTarget.contains(target)) return
  if (target.closest('[role="dialog"]')) return

  const shouldClose = window.confirm(BACKDROP_CONFIRM_MESSAGE)

  if (!shouldClose) {
    event.preventDefault()
    event.stopPropagation()
  }
}

const Dialog = (skin: Skin) => {
  return {
    MuiDialog: {
      defaultProps: {
        onClickCapture: handleDialogBackdropClickCapture
      },
      styleOverrides: {
        paper: ({ theme }: OwnerStateThemeType) => ({
          boxShadow: theme.shadows[skin === 'bordered' ? 0 : 18],
          ...(skin === 'bordered' && { border: `1px solid ${theme.palette.divider}` }),
          '&:not(.MuiDialog-paperFullScreen)': {
            [theme.breakpoints.down('sm')]: {
              margin: theme.spacing(4),
              width: `calc(100% - ${theme.spacing(8)})`,
              maxWidth: `calc(100% - ${theme.spacing(8)}) !important`
            }
          },
          '& > .MuiList-root': {
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1)
          }
        })
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme }: OwnerStateThemeType) => ({
          padding: theme.spacing(5, 6, 1)
        })
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme }: OwnerStateThemeType) => ({
          padding: `${theme.spacing(5, 6)} !important`
        })
      }
    },
    MuiDialogActions: {
      styleOverrides: {
        root: ({ theme }: OwnerStateThemeType) => ({
          padding: theme.spacing(1, 6, 5),
          '&.dialog-actions-dense': {
            padding: theme.spacing(1, 2.5, 2.5)
          }
        })
      }
    }
  }
}

export default Dialog
