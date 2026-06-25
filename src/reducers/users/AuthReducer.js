import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los datos de usuario logeado
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    id: null,
    user: '',
    fullname: '',
    language: '',
    avatar: null,
    userCompanies: null,
    userSettings: [],
    permissions: [],
    accumulatedTime: null,
    lastEntryStatus: null,
    nextEntry: '',
    accessUser: null,
    managerUser: null,
    pin: null,
    userAbsenceRole: '',
    administrator: 0,
    contracts: [],
    contract: null,
    contractId: null,
    geolocation: 0,
    remote: 0,
    captureEntry: 0,
    hours: '00h 00m 00s',
    worked: '00h 00m 00s',
    accumulated: '00h 00m 00s',
    breaks: [],
    comment: '',
    contractedHours: '00h 00m 00s',
    monthHours: '00h 00m 00s',
    workedHours: '00h 00m 00s',
    accumulatedHours: '00h 00m 00s',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notifications: [],
    status: -1,
    mustChangePassword: false,
    complianceRegistration: false,
    skip2FaPrompt: true,
    twoFactorMethod: '',
    documentApprover: 0
  },
  reducers: {
    // Obtenemos datos de usuario
    setUser(state, action) {
      state.user = action.payload
    },
    setAvatar(state, action) {
      state.avatar = action.payload
    },
    setFullname(state, action) {
      state.fullname = action.payload
    },
    setLanguage(state, action) {
      state.language = action.payload
    },
    setUserCompanies(state, action) {
      state.userCompanies = action.payload
    },
    setPermissions(state, action) {
      state.permissions = action.payload
    },
    setUserSettings(state, action) {
      state.userSettings = action.payload
    },
    replaceUserSettings(state, action) {
      const updatedUserSettings = action.payload
      const index = state.userSettings.findIndex(userSetting => userSetting.id === updatedUserSettings.id)
      if (index !== -1) {
        state.userSettings[index] = updatedUserSettings
      }
    },

    // Asignamos el tiempo acumulado
    setAccumulatedTime(state, action) {
      state.accumulatedTime = action.payload
    },

    // Asignamos el ultimo fichaje
    setLastEntryStatus(state, action) {
      state.lastEntryStatus = action.payload
    },
    setNextEntry(state, action) {
      state.nextEntry = action.payload
    },
    setAccessUser(state, action) {
      state.accessUser = action.payload
    },
    setManagerUser(state, action) {
      state.managerUser = action.payload
    },
    setPin(state, action) {
      state.pin = action.payload
    },
    setUserAbsenceRole(state, action) {
      state.userAbsenceRole = action.payload
    },
    setAdministrator(state, action) {
      state.administrator = action.payload
    },
    setContracts(state, action) {
      state.contracts = action.payload
    },
    setContract(state, action) {
      state.contract = action.payload
    },
    setContractId(state, action) {
      state.contractId = action.payload
    },
    setGeolocation(state, action) {
      state.geolocation = action.payload
    },
    setRemote(state, action) {
      state.remote = action.payload
    },
    setCaptureEntry(state, action) {
      state.captureEntry = action.payload
    },
    setHours(state, action) {
      state.hours = action.payload
    },
    setWorked(state, action) {
      state.worked = action.payload
    },
    setAccumulated(state, action) {
      state.accumulated = action.payload
    },
    setBreaks(state, action) {
      state.breaks = action.payload
    },
    setComment(state, action) {
      state.comment = action.payload
    },
    setContractedHours(state, action) {
      state.contractedHours = action.payload
    },
    setMonthHours(state, action) {
      state.monthHours = action.payload
    },
    setWorkedHours(state, action) {
      state.workedHours = action.payload
    },
    setAccumulatedHours(state, action) {
      state.accumulatedHours = action.payload
    },
    setMonth(state, action) {
      state.month = action.payload
    },
    setYear(state, action) {
      state.year = action.payload
    },
    setNotifications(state, action) {
      state.notifications = action.payload
    },
    setStatus(state, action) {
      state.status = action.payload
    },
    replaceUserNotifications(state, action) {
      const updatedUserNotification = action.payload
      const index = state.notifications.findIndex(notification => notification.id === updatedUserNotification.id)
      if (index !== -1) {
        state.notifications[index] = updatedUserNotification
      }
    },
    setMustChangePassword(state, action) {
      state.mustChangePassword = action.payload
    },
    setComplianceRegistrations(state, action) {
      state.complianceRegistration = action.payload
    },
    setSkip2FaPrompt(state, action) {
      state.skip2FaPrompt = action.payload
    },
    setTwoFactorMethod(state, action) {
      state.twoFactorMethod = action.payload
    },
    setDocumentApprover(state, action) {
      state.documentApprover = action.payload
    }
  }
})

export const authActions = authSlice.actions

export default authSlice.reducer
