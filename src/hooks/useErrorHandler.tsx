import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'

export const useErrorHandler = () => {
  const { t } = useTranslation()
  const router = useRouter()

  const handleError = (error: any, logout: any) => {
    if (error.response) {
      const data = error.response.data ?? {}

      if (error.response.status === 401 && data.message === 'Unauthenticated.') {
        if (logout) logout()
        toast.error(t('sessionExpired'), { position: 'top-right' })
        router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`)
      } else if (data.errors) {
        const messages = Array.isArray(data.errors)
          ? data.errors.map((item: any) => item?.message ?? item)
          : Object.values(data.errors).flat()

        messages.forEach((message: any) => {
          toast.error(t(String(message)), { position: 'top-right' })
        })
      } else {
        toast.error(data.message ? t(String(data.message)) : t('unexpectedError'), { position: 'top-right' })
      }
    } else {
      toast.error(error?.message ? String(error.message) : t('networkError'), { position: 'top-right' })
    }
  }

  return { handleError }
}
