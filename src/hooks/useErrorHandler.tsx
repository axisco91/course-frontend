import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router' // ✅ Import useRouter

export const useErrorHandler = () => {
  const { t } = useTranslation()
  const router = useRouter() // ✅ Use Next.js router

  const handleError = (error: any, logout: any) => {
    if (error.response) {
      console.log(error.response.data.message)

      if (error.response.status === 401) {
        const isAuthError = error.response.data.message === 'Unauthenticated.'
        console.log(error.response.data.message)
        console.log(isAuthError)
        if (isAuthError) {
          if (logout) logout() // Log the user out
          toast.error(t('sessionExpired'), { position: 'top-right' })
          router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`) // ✅ Redirect in Next.js
        }
      } else if (error.response.data.errors) {
        const errors = error.response.data.errors

        if (Array.isArray(errors)) {
          errors.forEach((err: any) => {
            toast.error(t(err.message), { position: 'top-right' })
          })
        } else {
          toast.error(t('unexpectedError'), { position: 'top-right' })
        }
      } else {
        const errorMessage = t(error.response.data.message) || t('unexpectedError')
        toast.error(errorMessage, { position: 'top-right' })
      }
    } else {
      const errorMessage = t('networkError')
      toast.error(errorMessage, { position: 'top-right' })
    }
  }

  return { handleError }
}
