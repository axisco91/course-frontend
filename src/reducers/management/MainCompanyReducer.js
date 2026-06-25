import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: '',
  email: '',
  url: ''
}

// Reducer donde se guarda los datos de las empresas
const mainCompanySlice = createSlice({
  name: 'mainCompany',
  initialState: {
    id: null,
    showEliminateDialog: false,
    companies: [],

    // filtros tabla
    filters: { ...initialFilters },
    appliedFilters: { ...initialFilters },

    // modal
    modalOpen: false,
    modalMode: 'view',

    selectedCompany: null,

    // legacy state
    searchText: '',
    inactive: false,
    centerId: null,
    license: 0
  },
  reducers: {
    // Asignamos el id
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setCompanies(state, action) {
      state.companies = action.payload
    },
    setSelectedCompany(state, action) {
      state.selectedCompany = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload?.mode ?? 'view'

      const modalId = action.payload?.mainCompanyId
      if (modalId !== undefined) {
        state.id = modalId
      }
    },
    closeModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
      state.selectedCompany = null
    },
    setFilter(state, action) {
      const { key, value } = action.payload
      state.filters[key] = value
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    applyFilters(state) {
      state.appliedFilters = { ...state.filters }
    },
    resetFilters(state) {
      state.filters = { ...initialFilters }
      state.appliedFilters = { ...initialFilters }
    },
    setSearchText(state, action) {
      state.searchText = action.payload
    },
    setInactive(state, action) {
      state.inactive = action.payload
    },
    setCenterId(state, action) {
      state.centerId = action.payload
    },
    setLicense(state, action) {
      state.license = action.payload
    }
  }
})

export const mainCompanyActions = mainCompanySlice.actions

export default mainCompanySlice.reducer
