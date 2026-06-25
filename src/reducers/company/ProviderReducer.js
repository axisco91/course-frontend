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
const providerSlice = createSlice({
  name: 'provider',
  initialState: {
    id: null,
    showEliminateDialog: false,
    providers: [],

    // ✅ filtros de la tabla
    filters: initialFilters, // draft (form)
    appliedFilters: initialFilters,

    // UI modal
    modalOpen: false,
    modalMode: 'view' // 'view' | 'edit' | 'create'
  },
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setProviders(state, action) {
      state.providers = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload?.mode ?? 'view'

      const modalId = action.payload?.providerId ?? action.payload?.courseId
      if (modalId !== undefined) {
        state.id = modalId
      }
    },
    closeProviderModal(state) {
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

export const providerActions = providerSlice.actions

export default providerSlice.reducer
