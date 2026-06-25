import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: '',
  nif: '',
  telephone: '',
  type: null,
  activity: null,
  advisor: null,
  province: null,
  status: null,
  collaborator: null,
  population: null
}

// Reducer donde se guarda los datos de las empresas
const potentialCompanySlice = createSlice({
  name: 'potentialCompany',
  initialState: {
    id: null,
    showEliminateDialog: false,
    potentialCompanies: [],
    companySuccess: false,

    // ✅ filtros de la tabla
    filters: initialFilters, // draft (form)
    appliedFilters: initialFilters,

    // UI modal
    modalOpen: false,
    modalMode: 'view', // 'view' | 'edit' | 'create'
    showClientDialog: false,
    showProviderDialog: false,
    showAdvisorDialog: false,
    showSendEmailModal: false
  },
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setPotentialCompanies(state, action) {
      state.potentialCompanies = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.companyId !== undefined) {
        state.id = action.payload.companyId
      }
    },
    closePotentialCompanyModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    },

    // -------------------------
    // ✅ Filtros
    // -------------------------
    setFilter(state, action) {
      const { key, value } = action.payload
      state.filters[key] = value
    },

    setFilters(state, action) {
      state.filters = {
        ...state.filters,
        ...action.payload
      }
    },
    applyFilters(state) {
      state.appliedFilters = { ...state.filters }
    },
    resetFilters(state) {
      state.filters = { ...initialFilters }
      state.appliedFilters = { ...initialFilters }
    },
    changeSendEmailModalStatus(state) {
      state.showSendEmailModal = !state.showSendEmailModal
    },
    setCompanySuccess(state, action) {
      state.companySuccess = action.payload
    }
  }
})

export const potentialCompanyActions = potentialCompanySlice.actions

export default potentialCompanySlice.reducer
