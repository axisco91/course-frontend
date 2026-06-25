import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: ''
}

const incidenceTypeSlice = createSlice({
  name: 'incidenceType',
  initialState: {
    // ✅ lo que ya tenías
    id: null,
    showEliminateDialog: false,
    incidenceTypes: null,

    filters: initialFilters, // draft (form)
    appliedFilters: initialFilters,

    // ✅ AÑADIDO para el modal
    modalOpen: false,
    modalMode: 'create',
    companyId: null
  },
  reducers: {
    // ✅ lo que ya tenías
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setIncidenceTypes(state, action) {
      state.incidenceTypes = action.payload
    },

    // ✅ AÑADIDO: abrir modal
    openModal(state, action) {
      const { mode, companyId, observationId } = action.payload || {}
      state.modalOpen = true
      state.modalMode = mode || 'create'
      state.companyId = companyId ?? null
      state.id = observationId ?? null
    },

    // ✅ AÑADIDO: cerrar modal
    closeModal(state) {
      state.modalOpen = false
      state.modalMode = 'create'
      state.companyId = null
      state.id = null
    },
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

export const incidenceTypeActions = incidenceTypeSlice.actions
export default incidenceTypeSlice.reducer
