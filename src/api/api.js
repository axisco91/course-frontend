import axios from 'axios'
import authConfig from 'src/configs/auth'

const getAuthToken = () =>
  typeof window !== 'undefined' ? window.localStorage.getItem(authConfig.storageTokenKeyName) : null

const getBaseURL = () => {
  if (typeof window === 'undefined') return ''

  const envBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
  if (envBackendUrl) {
    const normalizedBackendUrl = envBackendUrl.replace(/\/$/, '')

    return /\/api$/i.test(normalizedBackendUrl) ? normalizedBackendUrl : `${normalizedBackendUrl}/api`
  }

  const host = window.location.hostname

  if (host === 'localhost') {
    return 'http://127.0.0.1:8000/api'
  }

  return 'https://api.academypro.app/api' // producción por defecto
}

// Cuando no logeado
const instance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

// Cuando Logeado
export const authInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

const attachDynamicBaseUrl = client => {
  client.interceptors.request.use(config => {
    config.baseURL = getBaseURL()

    return config
  })
}

attachDynamicBaseUrl(instance)

authInstance.interceptors.request.use(config => {
  config.baseURL = getBaseURL()
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Cuando Logeado y tiene documento o imagen
export const authInstanceWithFile = axios.create({
  baseURL: getBaseURL(),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'multipart/form-data'
  }
})

authInstanceWithFile.interceptors.request.use(config => {
  config.baseURL = getBaseURL()
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Cuando descargas un excel
export const authInstanceExport = axios.create({
  baseURL: getBaseURL(),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  responseType: 'blob'
})

authInstanceExport.interceptors.request.use(config => {
  config.baseURL = getBaseURL()
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Obtenemos algunos datos de empresa y ademas las imagenes
export const fetchLayout = hostname => {
  const client = getAuthToken() ? authInstance : instance

  return client.get('/companies/basic', { params: { included: 'languages', hostname } })
}

// Login
export const login = data => instance.post(`/login`, data)
export const logout = data => instance.post(`/logout`, data)
export const passwordForgot = data => instance.post(`/password/forgot`, data)
export const passwordReset = data => instance.post(`/password/reset`, data)

export const totalRegistrations = data => authInstance.get('/statistics/totalRegistrations', { params: data })
export const choresMessages = data => authInstance.get('/statistics/getChores_welcome_messages', { params: data })

export const getBasicUser = data => authInstance.get('/users/basic-user', { params: data })

// Roles
export const getRoles = data => authInstance.get('/roles', { params: data })
export const getRole = (id, data) => authInstance.get(`/roles/${id}`, { params: data })
export const createRole = data => authInstance.post(`/roles`, data)
export const editRole = (id, data) => authInstance.put(`/roles/${id}`, data)
export const deleteRole = id => authInstance.delete(`/roles/${id}`)

// Permisos
export const getPermissions = data => authInstance.get('/permissions', { params: data })

// Alumnos
export const getStudentsExportExcel = data => authInstanceExport.get('/students/export-excel', { params: data })
export const getStudents = data => authInstance.get('/students', { params: data })
export const getStudent = (id, data) => authInstance.get(`/students/${id}`, { params: data })
export const createStudent = data => authInstance.post(`/students`, data)
export const editStudent = (id, data) => authInstance.put(`/students/${id}`, data)
export const deleteStudent = id => authInstance.delete(`/students/${id}`)
export const getStudentDocuments = data => authInstance.get('/students/get-student-documents', { params: data })
export const studentCheckDni = data => authInstance.get(`/students/check_dni`, { params: data })
export const getStudentCourses = (id, data) => authInstance.get(`/students/courses/${id}`, { params: data })
export const importStudents = data => authInstance.post(`/students/import`, data)

// Documentos
export const getContractDocuments = data => authInstance.get('/document-students', { params: data })
export const getDocuments = data => authInstance.get('/documents', { params: data })
export const getDocument = (id, data) => authInstance.get(`/documents/${id}`, { params: data })
export const createdocument = data => authInstance.post(`/documents`, data)
export const editDocument = (id, data) => authInstance.put(`/documents/${id}`, data)
export const deleteDocument = id => authInstance.delete(`/documents/${id}`)
export const sendDocument = data => authInstance.get(`/document-students/send`, { params: data })
export const generateTrainingContractBills = data => authInstance.post(`/document-students/generate-invoices`, data)

// Empresas
export const getCompaniesExportExcel = data => authInstanceExport.get('/companies/export-excel', { params: data })
export const getCompanyCoursesExportExcel = (id, data) =>
  authInstanceExport.get(`/companies/courses-export-excel/${id}`, { params: data })
export const getCompanies = data => authInstance.get(`/companies`, { params: data })
export const getCompany = (id, data) => authInstance.get(`/companies/${id}`, { params: data })
export const createCompany = data => authInstance.post(`/companies`, data)
export const editCompany = (id, data) => authInstance.put(`/companies/${id}`, data)
export const deleteCompany = id => authInstance.delete(`/companies/${id}`)
export const companyCourses = (id, data) => authInstance.get(`/companies/courses/${id}`, { params: data })
export const companyStudents = (id, data) => authInstance.get(`/companies/students/${id}`, { params: data })
export const convertClient = (id, data) => authInstance.get(`/companies/convert-client/${id}`, { params: data })
export const convertAdvisor = (id, data) => authInstance.get(`/companies/convert-advisor/${id}`, { params: data })
export const convertProvider = (id, data) => authInstance.get(`/companies/convert-provider/${id}`, { params: data })

// Asesorias
export const getAdvisorsExportExcel = data => authInstanceExport.get('/advisors/export-excel', { params: data })
export const getAdvisors = data => authInstance.get('/advisors', { params: data })
export const getAdvisor = (id, data) => authInstance.get(`/advisors/${id}`, { params: data })
export const createAdvisor = data => authInstance.post(`/advisors`, data)
export const editAdvisor = (id, data) => authInstance.put(`/advisors/${id}`, data)
export const deleteAdvisor = id => authInstance.delete(`/advisors/${id}`)
export const getAdvisorCourses = (id, data) => authInstance.get(`/advisors/courses/${id}`, { params: data })
export const getAdvisorCompanies = (id, data) => authInstance.get(`/advisors/companies/${id}`, { params: data })
export const getAdvisorTrainingContracts = (id, data) =>
  authInstance.get(`/advisors/training-contracts/${id}`, { params: data })
export const advisorCheckNif = data => authInstance.get(`/advisors/check-nif`, { params: data })

export const getAdvisorIncidences = (id, data) =>
  authInstance.get(`/advisor-incidences/advisor/${id}`, { params: data })
export const getAdvisorIncidence = data => authInstance.get('/advisor-incidences', { params: data })
export const createAdvisorIncidence = data => authInstance.post(`/advisor-incidences`, data)
export const editAdvisorIncidence = (id, data) => authInstance.put(`/advisor-incidences/${id}`, data)
export const deleteAdvisorIncidence = id => authInstance.delete(`/advisor-incidences/${id}`)

export const getAdvisorsWithCommissions = data => authInstance.get('/advisors/commissions', { params: data })
export const createAdvisorUser = (id, data) => authInstance.post(`/advisors/create-advisor-user/${id}`, data)
export const sendAdvisorEmail = (id, data) => authInstance.get(`/advisors/send-email/${id}`, { params: data })

// Colaboradores
export const getCollaborators = data => authInstance.get('/collaborators', { params: data })

// Cursos
export const getCourses = data => authInstance.get('/courses', { params: data })
export const getCoursesExportExcel = data => authInstanceExport.get('/courses/export-excel', { params: data })
export const getCourse = (id, data) => authInstance.get(`/courses/${id}`, { params: data })
export const createCourse = data => authInstance.post(`/courses`, data)
export const editCourse = (id, data) => authInstance.put(`/courses/${id}`, data)
export const deleteCourse = id => authInstance.delete(`courses/${id}`)
export const getCourseData = data => authInstance.get('/courses/set-data', { params: data })
export const getNextFormativeAction = (formative_action_id, data) =>
  authInstance.get(`/courses/next-formative-action/${formative_action_id}`, { params: data })
export const getCourseStudents = (id, data) => authInstance.get(`/courses/students/${id}`, { params: data })
export const updateCourseTracings = (id, data) => authInstance.put(`/courses/reset-tracings/${id}`, data)

// Matricular
export const getRegistrations = id => authInstance.get(`/registrations/get-registered/${id}`)
export const getRegistration = id => authInstance.get(`/registrations/${id}`)
export const createRegistration = data => authInstance.post(`/registrations`, data)
export const deleteRegistration = id => authInstance.delete(`/registrations/${id}`)
export const getNotRegistered = id => authInstance.get(`/registrations/get-not-registered/${id}`)
export const getAllRegistrations = data => authInstance.get('/registrations/get-all', { params: data })
export const updateRegistration = (id, data) => authInstance.put(`/registrations/${id}`, data)

// Docentes
export const getTeachersExportExcel = data => authInstanceExport.get('/teachers/export-excel', { params: data })
export const getTeachers = data => authInstance.get('/teachers', { params: data })
export const getTeacher = (id, data) => authInstance.get(`/teachers/${id}`, { params: data })
export const createTeacher = data => authInstance.post(`/teachers`, data)
export const editTeacher = (id, data) => authInstance.put(`/teachers/${id}`, data)
export const deleteTeacher = id => authInstance.delete(`teachers/${id}`)
export const teacherCheckDni = data => authInstance.get('/teachers/check_dni', { params: data })
export const getTeacherCourses = (id, data) => authInstance.get(`/teachers/courses/${id}`, { params: data })

// Areas de Docente
export const getTeacherAreas = data => authInstance.get('/teacher-areas', { params: data })
export const getTeacherArea = (id, data) => authInstance.get(`/teacher-areas/${id}`, { params: data })
export const createTeacherArea = data => authInstance.post(`/teacher-areas`, data)
export const editTeacherArea = (id, data) => authInstance.put(`/teacher-areas/${id}`, data)
export const deleteTeacherArea = id => authInstance.delete(`teacher-areas/${id}`)

// Tipo curso
export const getCourseTypes = data => authInstance.get('/course-types', { params: data })
export const getCourseType = (id, data) => authInstance.get(`/course-types/${id}`, { params: data })
export const createCourseType = data => authInstance.post(`/course-types`, data)
export const editCourseType = (id, data) => authInstance.put(`/course-types/${id}`, data)
export const deleteCourseType = id => authInstance.delete(`course-types/${id}`)

// Estado curso
export const getCourseStatuses = data => authInstance.get('/course-statuses', { params: data })

// Centros
export const getCenters = data => authInstance.get('/centers', { params: data })
export const getCenter = (id, data) => authInstance.get(`/centers/${id}`, { params: data })
export const createCenter = data => authInstance.post(`/centers`, data)
export const editCenter = (id, data) => authInstance.put(`/centers/${id}`, data)
export const deleteCenter = id => authInstance.delete(`centers/${id}`)

// Usuarios
export const getUsers = data => authInstance.get('/users', { params: data })
export const getUser = (id, data) => authInstance.get(`/users/${id}`, { params: data })
export const createUser = data => authInstanceWithFile.post(`/users`, data)
export const editUser = (id, data) => authInstanceWithFile.post(`/users/${id}`, data)
export const deleteUser = id => authInstance.delete(`users/${id}`)
export const getUsersWithCommissions = data => authInstance.get('/users/commissions', { params: data })
export const changeUserPassword = (id, data) => authInstance.post(`/users/change-password/${id}`, data)

// Acciones formativas
export const getTrainingActionsExportExcel = data =>
  authInstanceExport.get('/training-actions/export-excel', { params: data })
export const getTrainingActions = data => authInstance.get('/training-actions', { params: data })
export const getTrainingAction = (id, data) => authInstance.get(`/training-actions/${id}`, { params: data })
export const createTrainingAction = data => authInstance.post(`/training-actions`, data)
export const editTrainingAction = (id, data) => authInstance.put(`/training-actions/${id}`, data)
export const deleteTrainingAction = id => authInstance.delete(`training-actions/${id}`)
export const getTrainingActionFormativeAction = data =>
  authInstance.get('/training-actions/formative-action', { params: data })
export const getTrainingActionCourses = (id, data) =>
  authInstance.get(`/training-actions/courses/${id}`, { params: data })

// Tareas
export const getChoresExportExcel = data => authInstanceExport.get('/chores/export-excel', { params: data })
export const getChores = data => authInstance.get('/chores', { params: data })
export const getChore = (id, data) => authInstance.get(`/chores/${id}`, { params: data })
export const editChore = (id, data) => authInstance.put(`/chores/${id}`, data)
export const deleteChore = id => authInstance.delete(`/chores/${id}`)

// Seguimiento
export const getTracingsExportExcel = data => authInstanceExport.get('/tracings/export-excel', { params: data })
export const getTracings = data => authInstance.get('/tracings', { params: data })
export const getTracing = (id, data) => authInstance.get(`/tracings/${id}`, { params: data })
export const editTracing = (id, data) => authInstance.put(`/tracings/${id}`, data)
export const deleteTracing = id => authInstance.delete(`tracings/${id}`)

// Rentabilidad
export const getProfits = data => authInstance.get('/profitabilities', { params: data })
export const getProfitsExportExcel = data => authInstanceExport.get('/profitabilities/export-excel', { params: data })
export const getProfit = (id, data) => authInstance.get(`/profitabilities/${id}`, { params: data })
export const editProfit = (id, data) => authInstance.put(`/profitabilities/${id}`, data)
export const deleteProfit = id => authInstance.delete(`profitabilities/${id}`)
export const getProfitStudents = (id, data) => authInstance.get(`/profitabilities/students/${id}`, { params: data })

// Liquidaciones
export const getLiquidations = data => authInstance.get('/liquidations', { params: data })
export const getLiquidation = (id, data) => authInstance.get(`/liquidations/${id}`, { params: data })
export const createLiquidation = data => authInstance.post(`/liquidations`, data)
export const editLiquidation = (id, data) => authInstance.put(`/liquidations/${id}`, data)
export const deleteLiquidation = id => authInstance.delete(`liquidations/${id}`)

// Facturas
export const getBills = data => authInstance.get('/bills', { params: data })
export const getBillsExportExcel = data => authInstanceExport.get('/bills/export-excel', { params: data })
export const getBill = (id, data) => authInstance.get(`/bills/${id}`, { params: data })
export const editBill = (id, data) => authInstance.put(`/bills/${id}`, data)
export const deleteBill = id => authInstance.delete(`bills/${id}`)
export const getBillStudents = (id, data) => authInstance.get(`/bills/students/${id}`, { params: data })
export const getBillsMinYear = data => authInstance.get(`/bills/min-year`, { params: data })

// Contratos
export const getTrainingContracts = data => authInstance.get('/training-contracts', { params: data })
export const getTrainingContractsExportExcel = data =>
  authInstanceExport.get('/training-contracts/export-excel', { params: data })
export const getTrainingContract = id => authInstance.get(`/training-contracts/${id}`)
export const createTrainingContract = data => authInstance.post(`/training-contracts`, data)
export const editTrainingContract = (id, data) => authInstance.put(`/training-contracts/${id}`, data)
export const deleteTrainingContract = id => authInstance.delete(`training-contracts/${id}`)
export const additionalClauseTrainingContract = (id, data) =>
  authInstance.put(`/training-contracts/update-additional-clause/${id}`, data)
export const getTrainingContractCfaNumber = data => authInstance.get('/training-contracts/cfa-number', { params: data })
export const getTrainingContractSpecialties = (id, data) =>
  authInstance.get(`/training-contracts/specialties/${id}`, { params: data })
export const getTrainingContractCertifications = (id, data) =>
  authInstance.get(`/training-contracts/certifications/${id}`, { params: data })
export const calculateTrainingContractHours = (id, data) =>
  authInstance.get(`/training-contracts/calculate-hours/${id}`, { params: data })
export const register = (id, data) => authInstance.put(`/training-contracts/register/${id}`, data)
export const calculateEndDates = (id, dailyHours1, dailyHours2, data) =>
  authInstance.put(`/training-contracts/calculate-end-dates/${id}/${dailyHours1}/${dailyHours2}`, data)
export const getTrainingContractActions = id => authInstance.get(`training-contracts/training-actions/${id}`)

export const getTrainingContractElements = () => authInstance.get(`/training-contract-elements`)
export const getTrainingContractElementsWithId = (id, data) =>
  authInstance.get(`/training-contract-elements/${id}`, { params: data })
export const getTrainingContractElement = (id, data) =>
  authInstance.get(`/training-contract-elements/${id}`, { params: data })
export const createTrainingContractElement = (id, data) => authInstance.post(`/training-contract-elements/${id}`, data)
export const trainingContractElementEditDate = (id, data) =>
  authInstance.put(`/training-contract-elements/edit-date/${id}`, data)
export const updateTutorInfo = (id, data) => authInstance.put(`/training-contract-elements/edit-tutor-info/${id}`, data)
export const deleteTrainingContract_element = id => authInstance.delete(`training-contract-elements/${id}`)
export const orderElements = data => authInstance.post(`/training-contract-elements/order`, data)
export const getAllTrainingContractElements = data =>
  authInstance.get('/training-contract-elements/display/all', { params: data })
export const getActiveTrainingContractElements = data =>
  authInstance.get('/training-contract-elements/display/active', { params: data })

// Examens y tutorias
export const getExamTutorials = id => authInstance.get(`/exams-tutorials/${id}`)
export const getExamTutorial = (id, data) => authInstance.get(`/exams-tutorials/${id}`, { params: data })
export const createExamTutorial = data => authInstance.post(`/exams-tutorials`, data)
export const editExamTutorial = (id, data) => authInstance.put(`/exams-tutorials/${id}`, data)
export const deleteExamTutorial = id => authInstance.delete(`exams-tutorials/${id}`)

// Provincias
export const getProvinces = data => instance.get('/provinces', { params: data })
export const getProvince = (id, data) => authInstance.get(`/provinces/${id}`, { params: data })
export const createProvince = data => authInstance.post(`/provinces`, data)
export const editProvince = (id, data) => authInstance.put(`/provinces/${id}`, data)
export const deleteProvince = id => authInstance.delete(`provinces/${id}`)
export const getProvincesWithFestivals = data => instance.get('/provinces/provinces-with-festivals', { params: data })

// Tipo empresas
export const getCompanyTypes = data => instance.get('/company-types', { params: data })
export const getCompanyType = (id, data) => authInstance.get(`/company-types/${id}`, { params: data })
export const createCompanyType = data => authInstance.post(`/company-types`, data)
export const editCompanyType = (id, data) => authInstance.put(`/company-types/${id}`, data)
export const deleteCompanyType = id => authInstance.delete(`company-types/${id}`)

// Categorias professionales
export const getProfessionalCategories = data => authInstance.get('/professional-categories', { params: data })
export const getProfessionalCategoriesPublic = data => instance.get('/professional-categories', { params: data })
export const getProfessionalCategory = (id, data) =>
  authInstance.get(`/professional-categories/${id}`, { params: data })
export const createProfessionalCategory = data => authInstance.post(`/professional-categories`, data)
export const editProfessionalCategory = (id, data) => authInstance.put(`/professional-categories/${id}`, data)
export const deleteProfessionalCategory = id => authInstance.delete(`professional-categories/${id}`)

// Grupos cuotas
export const getQuoteGroups = data => authInstance.get('/quote-groups', { params: data })

// Nivel estudio
export const getLevelStudies = data => instance.get('/level-studies', { params: data })
export const getLevelStudy = (id, data) => authInstance.get(`/level-studies/${id}`, { params: data })
export const createLevelStudy = data => authInstance.post(`/level-studies`, data)
export const editLevelStudy = (id, data) => authInstance.put(`/level-studies/${id}`, data)
export const deleteLevelStudy = id => authInstance.delete(`level-studies/${id}`)

// Actividades
export const getCompanyActivities = data => instance.get('/company-activities', { params: data })

// Cnaes
export const getCnaes = data => instance.get('/cnaes', { params: data })
export const getCnae = (id, data) => authInstance.get(`/cnaes/${id}`, { params: data })
export const createCnae = data => authInstance.post(`/cnaes`, data)
export const editCnae = (id, data) => authInstance.put(`/cnaes/${id}`, data)
export const deleteCnae = id => authInstance.delete(`cnaes/${id}`)

// Tipos incidencias
export const getIncidenceTypes = data => authInstance.get('/incidence-types', { params: data })
export const getIncidenceType = (id, data) => authInstance.get(`/incidence-types/${id}`, { params: data })
export const createIncidenceType = data => authInstance.post(`/incidence-types`, data)
export const editIncidenceType = (id, data) => authInstance.put(`/incidence-types/${id}`, data)
export const deleteIncidenceType = id => authInstance.delete(`incidence-types/${id}`)

// Incidencias de empresas
export const getCompanyIncidences = id => authInstance.get(`/company-incidences/${id}`)
export const getCompanyIncidence = (id, data) => authInstance.get(`/incidence-types/${id}`, { params: data })
export const createCompanyIncidence = data => authInstance.post(`/company-incidences`, data)
export const editCompanyIncidence = (id, data) => authInstance.put(`/company-incidences/${id}`, data)
export const deleteCompanyIncidence = id => authInstance.delete(`company-incidences/${id}`)

// Observaciººones de empresas
export const getCompanyObservations = (id, data) => authInstance.get(`/company-observations/${id}`, { params: data })
export const getCompanyObservation = id => authInstance.get(`/company-observations/get/${id}`)
export const createCompanyObservation = data => authInstance.post(`/company-observations`, data)
export const editCompanyObservation = (id, data) => authInstance.put(`/company-observations/${id}`, data)
export const deleteCompanyObservation = id => authInstance.delete(`company-observations/${id}`)

// Observaciones de asesorias
export const getAdvisorObservations = id => authInstance.get(`/advisor-observations/${id}`)
export const createAdvisorObservation = data => authInstance.post(`/advisor-observations`, data)
export const editAdvisorObservation = (id, data) => authInstance.put(`/advisor-observations/${id}`, data)
export const deleteAdvisorObservation = id => authInstance.delete(`advisor-observations/${id}`)

// Creditos de empresas
export const getCredits = data => authInstance.get(`/credits`, { params: data })
export const getCredit = (id, data) => authInstance.get(`/credits/${id}`, { params: data })
export const createCredit = data => authInstance.post(`/credits`, data)
export const editCredit = (id, data) => authInstance.put(`/credits/${id}`, data)
export const deleteCredit = id => authInstance.delete(`credits/${id}`)

// Tipos acciones
export const getActionTypes = data => authInstance.get('/action-types', { params: data })
export const getActionType = (id, data) => authInstance.get(`/action-types/${id}`, { params: data })
export const createActionType = data => authInstance.post(`/action-types`, data)
export const editActionType = (id, data) => authInstance.put(`/action-types/${id}`, data)
export const deleteActionType = id => authInstance.delete(`action-types/${id}`)

// Familias professionales
export const getProfessionalFamilies = data => authInstance.get('/professional-families', { params: data })
export const getProfessionalFamily = (id, data) => authInstance.get(`/professional-families/${id}`, { params: data })
export const createProfessionalFamily = data => authInstance.post(`/professional-families`, data)
export const editProfessionalFamily = (id, data) => authInstance.put(`/professional-families/${id}`, data)
export const deleteProfessionalFamily = id => authInstance.delete(`professional-families/${id}`)

// Areas professionales
export const getProfessionalAreas = data => authInstance.get('/professional-areas', { params: data })
export const getProfessionalArea = (id, data) => authInstance.get(`/professional-areas/${id}`, { params: data })
export const createProfessionalArea = data => authInstance.post(`/professional-areas`, data)
export const editProfessionalArea = (id, data) => authInstance.put(`/professional-areas/${id}`, data)
export const deleteProfessionalArea = id => authInstance.delete(`professional-areas/${id}`)

// Modalidades
export const getModalities = data => authInstance.get('/modalities', { params: data })
export const getModality = (id, data) => authInstance.get(`/modalities/${id}`, { params: data })
export const createModality = data => authInstance.post(`/modalities`, data)
export const editModality = (id, data) => authInstance.put(`/modalities/${id}`, data)
export const deleteModality = id => authInstance.delete(`modalities/${id}`)

// Proveedores
export const getProviders = data => authInstance.get('/providers', { params: data })
export const getProvider = (id, data) => authInstance.get(`/providers/${id}`, { params: data })
export const createProvider = data => authInstance.post(`/providers`, data)
export const editProvider = (id, data) => authInstance.put(`/providers/${id}`, data)
export const deleteProvider = id => authInstance.delete(`providers/${id}`)
export const getProviderTrainingActions = (id, data) =>
  authInstance.get(`/provider/training-actions/${id}`, { params: data })

// Empresas principales (branding y acceso tenant)
export const getMainCompanies = data => authInstance.get('/main-companies', { params: data })
export const getMainCompany = (id, data) => authInstance.get(`/main-companies/${id}`, { params: data })
export const createMainCompany = data => authInstanceWithFile.post('/main-companies', data)
export const editMainCompany = (id, data) => authInstanceWithFile.post(`/main-companies/${id}`, data)
export const deleteMainCompany = id => authInstance.delete(`main-companies/${id}`)

// Grupos acciones formativas
export const getTrainingActionGroups = data => authInstance.get('/training-action-groups', { params: data })
export const getTrainingActionGroup = (id, data) => authInstance.get(`/training-action-groups/${id}`, { params: data })
export const createTrainingActionGroup = data => authInstance.post(`/training-action-groups`, data)
export const editTrainingActionGroup = (id, data) => authInstance.put(`/training-action-groups/${id}`, data)
export const deleteTrainingActionGroup = id => authInstance.delete(`training-action-groups/${id}`)

// Nivel acciones formaticas
export const getTrainingActionLevels = data => authInstance.get('/training-action-levels', { params: data })
export const getTrainingActionLevel = (id, data) => authInstance.get(`/training-action-levels/${id}`, { params: data })
export const createTrainingActionLevel = data => authInstance.post(`/training-action-levels`, data)
export const editTrainingActionLevel = (id, data) => authInstance.put(`/training-action-levels/${id}`, data)
export const deleteTrainingActionLevel = id => authInstance.delete(`training-action-levels/${id}`)

// Tutorias
export const getTutorings = data => authInstance.get('/tutorings', { params: data })
export const getTutoring = (id, data) => authInstance.get(`/tutorings/${id}`, { params: data })
export const createTutoring = data => authInstance.post(`/tutorings`, data)
export const editTutoring = (id, data) => authInstance.put(`/tutorings/${id}`, data)
export const deleteTutoring = id => authInstance.delete(`tutorings/${id}`)

// Plataformas
export const getWebPlatforms = data => authInstance.get('/web-platforms', { params: data })
export const getWebPlatform = (id, data) => authInstance.get(`/web-platforms/${id}`, { params: data })
export const createWebPlatform = data => authInstance.post(`/web-platforms`, data)
export const editWebPlatform = (id, data) => authInstance.put(`/web-platforms/${id}`, data)
export const deleteWebPlatform = id => authInstance.delete(`web-platforms/${id}`)

// origen de cursos
export const getCourseOrigins = data => authInstance.get('/course-origins', { params: data })
export const getCourseOrigin = (id, data) => authInstance.get(`/course-origins/${id}`, { params: data })
export const createCourseOrigin = data => authInstance.post(`/course-origins`, data)
export const editCourseOrigin = (id, data) => authInstance.put(`/course-origins/${id}`, data)
export const deleteCourseOrigin = id => authInstance.delete(`course-origins/${id}`)

// certificados
export const getCertifications = data => authInstance.get('/certifications', { params: data })
export const getCertification = (id, data) => authInstance.get(`/certifications/${id}`, { params: data })
export const createCertification = data => authInstance.post(`/certifications`, data)
export const editCertification = (id, data) => authInstance.put(`/certifications/${id}`, data)
export const deleteCertification = id => authInstance.delete(`certifications/${id}`)

// Elementos de certificados
export const getCertificationElements = (id, data) =>
  authInstance.get(`/certification-elements/elements/${id}`, { params: data })
export const getCertificationElementUnits = (id, data) =>
  authInstance.get(`/certification-elements/units/${id}`, { params: data })
export const getCertificationElementModules = (id, data) =>
  authInstance.get(`/certification-elements/modules/${id}`, { params: data })
export const createCertificationElements = data => authInstance.post(`/certification-elements`, data)
export const deleteCertificationElements = id => authInstance.delete(`certification-elements/${id}`)

// Ocupaciones
export const getOccupations = data => authInstance.get('/occupations', { params: data })
export const getOccupation = (id, data) => authInstance.get(`/occupations/${id}`, { params: data })
export const createOccupation = data => authInstance.post(`/occupations`, data)
export const editOccupation = (id, data) => authInstance.put(`/occupations/${id}`, data)
export const deleteOccupation = id => authInstance.delete(`occupations/${id}`)

// On Leave Types
export const getOnLeaveTypes = data => authInstance.get('/on-leave-types', { params: data })
export const getOnLeaveType = (id, data) => authInstance.get(`/on-leave-types/${id}`, { params: data })
export const createOnLeaveType = data => authInstance.post(`/on-leave-types`, data)
export const editOnLeaveType = (id, data) => authInstance.put(`/on-leave-types/${id}`, data)
export const deleteOnLeaveType = id => authInstance.delete(`on-leave-types/${id}`)

// Payments
export const getPayments = data => authInstance.get('payments', { params: data })
export const getPayment = (id, data) => authInstance.get(`/payments/${id}`, { params: data })
export const createPayment = data => authInstance.post(`/payments`, data)
export const editPayment = (id, data) => authInstance.put(`/payments/${id}`, data)
export const deletePayment = id => authInstance.delete(`payments/${id}`)

// Training Contract Statuses
export const getTrainingContractStatuses = data => authInstance.get('training-contract-statuses', { params: data })
export const getTrainingContractStatus = (id, data) =>
  authInstance.get(`/training-contract-statuses/${id}`, { params: data })
export const createTrainingContractStatus = data => authInstance.post(`/training-contract-statuses`, data)
export const editTrainingContractStatus = (id, data) => authInstance.put(`/training-contract-statuses/${id}`, data)
export const deleteTrainingContractStatus = id => authInstance.delete(`training-contract-statuses/${id}`)

// Training Units
export const getTrainingUnits = data => authInstance.get('training-units', { params: data })
export const getTrainingUnit = (id, data) => authInstance.get(`/training-units/${id}`, { params: data })
export const createTrainingUnit = data => authInstance.post(`/training-units`, data)
export const editTrainingUnit = (id, data) => authInstance.put(`/training-units/${id}`, data)
export const deleteTrainingUnit = id => authInstance.delete(`training-units/${id}`)

// Modules
export const getModules = data => authInstance.get('modules', { params: data })
export const getModule = (id, data) => authInstance.get(`/modules/${id}`, { params: data })
export const createModule = data => authInstance.post(`/modules`, data)
export const editModule = (id, data) => authInstance.put(`/modules/${id}`, data)
export const deleteModule = id => authInstance.delete(`modules/${id}`)
export const getModuleUnits = (id, data) => authInstance.get(`/modules/units/${id}`, { params: data })
export const addModuleUnit = data => authInstance.post(`/modules/add-unit/`, data)
export const removeModuleUnit = id => authInstance.delete(`modules/remove-unit/${id}`)
export const getModuleUnitNotUsed = (id, data) => authInstance.get(`/modules/not-used-units/${id}`, { params: data })

// Banck Holiday Groups
export const getBankHolidayGroups = data => authInstance.get('bank-holiday-groups', { params: data })
export const createBankHolidayGroup = data => authInstance.post(`/bank-holiday-groups`, data)
export const editBankHolidayGroup = (id, data) => authInstance.put(`/bank-holiday-groups/${id}`, data)
export const deleteBankHolidayGroup = id => authInstance.delete(`bank-holiday-groups/${id}`)

// Training Contract Excluded Days
export const getTrainingContractExcludedDays = data =>
  authInstance.get('training-contract-excluded-days', { params: data })
export const createTrainingContractExcludedDays = data => authInstance.post(`/training-contract-excluded-days`, data)
export const deleteTrainingContractExcludedDays = id => authInstance.delete(`training-contract-excluded-days/${id}`)

export const getTrainingContractFestivals = data => authInstance.get('training-contract-festivals', { params: data })
export const createTrainingContractFestival = data => authInstance.post(`/training-contract-festivals`, data)
export const deleteTrainingContractFestival = id => authInstance.delete(`training-contract-festivals/${id}`)

// Training Contract Bonuses
export const getTrainingContractBonuses = (id, data) =>
  authInstance.get(`training-contract-bonuses/${id}`, { params: data })
export const getTrainingContractBonus = (id, data) =>
  authInstance.get(`/training-contract-bonuses/${id}`, { params: data })
export const createTrainingContractBonus = data => authInstance.post(`/training-contract-bonuses`, data)
export const editTrainingContractBonus = (id, data) => authInstance.put(`/training-contract-bonuses/${id}`, data)
export const deleteTrainingContractBonus = id => authInstance.delete(`training-contract-bonuses/${id}`)
export const generateTrainingContractBonus = (id, data) =>
  authInstance.get(`/training-contract-bonuses/generate/${id}`, { params: data })

// Training Contract Incidences
export const getTrainingContractIncidences = (id, data) =>
  authInstance.get(`training-contract-incidences/${id}`, { parmas: data })
export const getTrainingContractIncidence = id => authInstance.get(`/training-contract-incidences/show/${id}`)
export const createTrainingContractIncidence = data => authInstance.post(`/training-contract-incidences`, data)
export const editTrainingContractIncidence = (id, data) => authInstance.put(`/training-contract-incidences/${id}`, data)
export const deleteTrainingContractIncidence = id => authInstance.delete(`training-contract-incidences/${id}`)

// Training Contract Bills
export const getTrainingContractBillsExportExcel = data =>
  authInstanceExport.get('/training-contract-bills/export-excel', { params: data })
export const getTrainingContractBills = data => authInstance.get('/training-contract-bills', { params: data })
export const getTrainingContractBill = (id, data) =>
  authInstance.get(`/training-contract-bills/${id}`, { params: data })
export const createTrainingContractBill = '/training-contract-bills/create'
export const editTrainingContractBill = '/training-contract-bills/edit'
export const getTrainingContractBillYears = data => authInstance.get('/training-contract-bills/years', { params: data })
export const deleteTrainingContractBill = id => authInstance.delete(`/training-contract-bills/${id}`)

// Training Contract Series
export const getTrainingContractSeries = data => authInstance.get('training-contract-series', { params: data })
export const getTrainingContractSerie = (id, data) =>
  authInstance.get(`/training-contract-series/${id}`, { params: data })
export const createTrainingContractSeries = data => authInstance.post(`/training-contract-series`, data)
export const editTrainingContractSeries = (id, data) => authInstance.put(`/training-contract-series/${id}`, data)
export const deleteTrainingContractSeries = id => authInstance.delete(`training-contract-series/${id}`)

// Potential Students
export const getPotentialStudents = data => authInstance.get('potential-students', { params: data })
export const getPotentialStudent = (id, data) => authInstance.get(`/potential-students/${id}`, { params: data })
export const createPotentialStudent = data => authInstance.post(`/potential-students`, data)
export const createPotentialStudentPublic = data => instance.post(`/potential-students`, data)
export const editPotentialStudent = (id, data) => authInstance.put(`/potential-students/${id}`, data)
export const convertPotentialStudent = (id, data) => authInstance.put(`/potential-students/convert/${id}`, data)
export const deletePotentialStudent = id => authInstance.delete(`potential-students/${id}`)
export const potentialStudentCheckDni = data => authInstance.get('potential-students/check-dni', { params: data })
export const potentialStudentCheckDniPublic = data => instance.get('potential-students/check-dni', { params: data })
export const sendPotentialBonusStudent = data => authInstance.post('potential-students/send-bonus-email', data)
export const sendPotentialstudent = data => authInstance.post('potential-students/send-email', data)

// Potential Companies
export const getPotentialCompanies = data => authInstance.get('potential-companies', { params: data })
export const getPotentialCompany = (id, data) => authInstance.get(`/potential-companies/${id}`, { params: data })
export const createPotentialCompany = data => authInstance.post(`/potential-companies`, data)
export const createPotentialCompanyPublic = data => instance.post(`/potential-companies`, data)
export const editPotentialCompany = (id, data) => authInstance.put(`/potential-companies/${id}`, data)
export const deletePotentialCompany = id => authInstance.delete(`potential-companies/${id}`)
export const convertPotentialCompany = (id, data) => authInstance.put(`/potential-companies/convert/${id}`, data)
export const sendPotentialCompany = data => authInstance.post('potential-companies/send-email', data)

// Potential Training Contrats
export const getPotentialTrainingContracts = data => authInstance.get('potential-training-contract', { params: data })
export const getPotentialTrainingContract = (id, data) =>
  authInstance.get(`/potential-training-contract/${id}`, { params: data })
export const createPotentialTrainingContract = data => authInstance.post(`/potential-training-contract`, data)
export const editPotentialTrainingContract = (id, data) => authInstance.put(`/potential-training-contract/${id}`, data)
export const deletePotentialTrainingContract = id => authInstance.delete(`potential-training-contract/${id}`)
export const sendEmailPotentialTrainingContract = data =>
  authInstance.get('potential-training-contract/send-email', { params: data })

// festivos nacionales
export const getNacionalFestivals = data => authInstance.get('nacional-festivals', { params: data })
export const getNacionalFestival = id => authInstance.get(`nacional-festivals/${id}`)
export const createNacionalFestivals = data => authInstance.post(`/nacional-festivals`, data)
export const editNacionalFestivals = (id, data) => authInstance.put(`/nacional-festivals/${id}`, data)
export const deleteNacionalFestivals = id => authInstance.delete(`nacional-festivals/${id}`)

// festivos provinciales
export const getProvinceFestivals = data => authInstance.get('province-festivals', { params: data })
export const createProvinceFestivals = data => authInstance.post(`/province-festivals`, data)
export const editProvinceFestivals = (id, data) => authInstance.put(`/province-festivals/${id}`, data)
export const deleteProvinceFestivals = id => authInstance.delete(`province-festivals/${id}`)

// festivos poblaciones
export const getPopulationFestivals = data => authInstance.get('population-festivals', { params: data })
export const createPopulationFestival = data => authInstance.post(`/population-festivals`, data)
export const editPopulationFestival = (id, data) => authInstance.put(`/population-festivals/${id}`, data)
export const deletePopulationFestival = id => authInstance.delete(`population-festivals/${id}`)

// festivos comunidades
export const getCommunityFestivals = data => authInstance.get('community-festivals', { params: data })
export const createCommunityFestival = data => authInstance.post(`/community-festivals`, data)
export const editCommunityFestival = (id, data) => authInstance.put(`/community-festivals/${id}`, data)
export const deleteCommunityFestival = id => authInstance.delete(`community-festivals/${id}`)

// comunidades
export const getCommunities = data => authInstance.get('communities', { params: data })
export const getCommunity = (id, data) => authInstance.get(`/communities/${id}`, { params: data })
export const createCommunity = data => authInstance.post(`/communities`, data)
export const editCommunity = (id, data) => authInstance.put(`/communities/${id}`, data)
export const deleteCommunity = id => authInstance.delete(`communities/${id}`)
export const getCommunitiesWithFestivals = data =>
  authInstance.get('communities/communities-with-festivals', { params: data })

export const getPopulations = data => authInstance.get('populations', { params: data })
export const getPopulation = (id, data) => authInstance.get(`/populations/${id}`, { params: data })
export const createPopulation = data => authInstance.post(`/populations`, data)
export const editPopulation = (id, data) => authInstance.put(`/populations/${id}`, data)
export const deletePopulation = id => authInstance.delete(`populations/${id}`)
export const getPopulationsWithFestivals = data =>
  authInstance.get('populations/populations-with-festivals', { params: data })

// Excluded Day types
export const getExcludedDayTypes = data => authInstance.get('excluded-day-types', { params: data })

// comisiones asesorías
export const getAdvisorCommissions = (id, data) => authInstance.get(`advisor-commissions/${id}`, { params: data })
export const getAdvisorCommission = (id, data) => authInstance.get(`/advisor-commissions/${id}`, { params: data })
export const editAdvisorCommission = (id, data) => authInstance.put(`/advisor-commissions/${id}`, data)
export const deleteAdvisorCommission = id => authInstance.delete(`advisor-commissions/${id}`)

// Tipos comisiones
export const getCommissionTypes = data => authInstance.get('commission-types', { params: data })
export const getCommissionType = (id, data) => authInstance.get(`/commission-types/${id}`, { params: data })
export const deleteCommissionType = id => authInstance.delete(`commission-types/${id}`)

// comisiones usuarios
export const getUserCommissions = (id, data) => authInstance.get(`user-commissions/${id}`, { params: data })
export const getUserCommission = (id, data) => authInstance.get(`/user-commissions/get/${id}`, { params: data })
export const editUserCommission = (id, data) => authInstance.post(`/user-commissions/${id}`, data)
export const deleteUserCommission = id => authInstance.delete(`user-commissions/${id}`)

// Tipo comisiones usuarios
export const getUserCommissionTypes = id => authInstance.get(`user-commission-types/${id}`)
export const updateUserCommissionType = data => authInstance.post(`/user-commission-types`, data)

// Tipo comisiones asesorias
export const getAdvisorCommissionTypes = id => authInstance.get(`advisor-commission-types/${id}`)
export const updateAdvisorcommissionType = data => authInstance.post(`/advisor-commission-types/update`, data)

// PDF Documents
export const getDocumentTypes = data => authInstance.get('document-types', { params: data })
export const viewPdf = (key, viewName, trainingContract, data) =>
  authInstance.get(`/document-students/student-view-pdf/${key}/${viewName}/${trainingContract}`, { params: data })
export const signDocument = data => authInstanceWithFile.post(`/document-students/sign-pdf`, data)

export const getDocumentStudentBill = (viewName, trainingContract, data) =>
  authInstanceWithFile.get(`/document-students/test-pdf-factura/${viewName}/${trainingContract}`, { params: data })
export const getDocumentStudent = (viewName, trainingContract, data) =>
  authInstanceExport.get(`/document-students/test-pdf/${viewName}/${trainingContract}`, { params: data })

export const getDashboardCoursesMetric = data => authInstance.get('/dashboard/courses-metric', { params: data })
export const getDashboardRegistrationsMetric = data => authInstance.get('/dashboard/registrations-metric', { params: data })
export const getDashboardLiveTrainingContracts = data =>
  authInstance.get('/dashboard/live-training-contracts', { params: data })
export const getDashboardLiveCourses = data => authInstance.get('/dashboard/live-courses', { params: data })
export const getDashboardAdvisorsCommissionsTop = data =>
  authInstance.get('/dashboard/advisors-commissions-top', { params: data })
export const getDashboardUsersCommissionsTop = data =>
  authInstance.get('/dashboard/users-commissions-top', { params: data })
export const getDashboardCalendarEvents = data => authInstance.get('/dashboard/calendar-events', { params: data })
export const getDashboardTracingNotifications = data =>
  authInstance.get('/dashboard/tracing-notifications', { params: data })

export const getCalendarTracings = data => authInstance.get('calendar', { params: data })

export const getMainCompanyBasic = data => instance.get('/main-companies/basic', { params: data })

export const getCompanySettings = () => instance.get(`companies/settings`)
export const getCompanySetting = (companyId, key) => authInstance.get(`companies/${companyId}/settings/${key}`)
