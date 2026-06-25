import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: ''
}

// Reducer donde se guarda los datos de las empresas
const companyTypeSlice = createSlice({
  name: 'companyType',
  initialState: {
    id: null,
    showEliminateDialog: false,
    companyTypes: null,
    filters: initialFilters, // draft (form)
    appliedFilters: initialFilters,

    // UI modal
    modalOpen: false,
    modalMode: 'view'
  },
  reducers: {
    // Asignamos el id
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setCompanyTypes(state, action) {
      state.companyTypes = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeModal(state) {
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
    }
  }
})

export const companyTypeActions = companyTypeSlice.actions

export default companyTypeSlice.reducer
