import axios from 'axios'
import Cookies from 'js-cookie'

// Config global para Axios
axios.defaults.withCredentials = true
axios.defaults.xsrfCookieName = 'XSRF-TOKEN'
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN'

// OPCIONAL si quieres ver si lo está seteando
axios.interceptors.request.use(config => {
  const token = Cookies.get('XSRF-TOKEN')
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token
  }

  return config
})
