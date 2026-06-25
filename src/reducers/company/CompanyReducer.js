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
const companySlice = createSlice({
  name: 'company',
  initialState: {
    id: null,
    showEliminateDialog: false,
    companies: [],

    // ✅ filtros de la tabla
    filters: initialFilters, // draft (form)
    appliedFilters: initialFilters,

    // UI modal
    modalOpen: false,
    modalMode: 'view', // 'view' | 'edit' | 'create'
    showClientDialog: false,
    showProviderDialog: false,
    showAdvisorDialog: false
  },
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setCompanies(state, action) {
      state.companies = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.companyId !== undefined) {
        state.id = action.payload.companyId
      }
    },
    closeCompanyModal(state) {
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
    setShowClientDialog(state, action) {
      state.showClientDialog = action.payload
    },
    setShowProviderDialog(state, action) {
      state.showProviderDialog = action.payload
    },
    setShowAdvisorDialog(state, action) {
      state.showAdvisorDialog = action.payload
    }
  }
})

export const companyActions = companySlice.actions

export default companySlice.reducer
