// localeUtils.js

import { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'

export const registerLocales = () => {
  registerLocale('es', es)
}
