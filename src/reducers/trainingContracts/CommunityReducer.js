import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  name: ''
}

// Reducer donde se guarda los generos
const communitySlice = createSlice({
  name: 'community',
  initialState: {
    id: null,
    showEliminateDialog: false,
    communities: null,
    filters: initialFilters,
    appliedFilters: initialFilters,

    // =========
    // UI MODAL
    // =========
    modalOpen: false,
    modalMode: 'view', // (lo mantengo por compat)
    // ✅ NUEVO: modo interno del modal (tu viejo código usa "create" / "info")
    modalStatus: 'info'
  },
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setCommunities(state, action) {
      state.communities = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.showModal = true

      state.modalMode = action.payload.mode

      // opcional: mapeo automático
      state.modalStatus = action.payload.mode === 'create' ? 'create' : action.payload.mode === 'edit' ? 'edit' : 'info'

      if (action.payload.nacionalFestivalId !== undefined) {
        state.id = action.payload.nacionalFestivalId
      }
    },

    closeModal(state) {
      state.modalOpen = false
      state.showModal = false
      state.modalMode = 'view'
      state.modalStatus = 'info'
      state.id = null
    },

    // ✅ tu antiguo "toggle"
    changeModalStatus(state) {
      state.showModal = !state.showModal
      state.modalOpen = state.showModal
      if (!state.showModal) {
        // al cerrar
        state.modalMode = 'view'
        state.modalStatus = 'info'
        state.id = null
      }
    },

    // ✅ tu antiguo setModalStatus('create'|'info'|'edit')
    setModalStatus(state, action) {
      state.modalStatus = action.payload

      // sincronizo modalMode por si lo usas en otros sitios
      if (action.payload === 'create') state.modalMode = 'create'
      else if (action.payload === 'edit') state.modalMode = 'edit'
      else state.modalMode = 'view'
    },

    // =================
    // FILTERS
    // =================
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
    }
  }
})

export const communityActions = communitySlice.actions

export default communitySlice.reducer
