// src/reducers/examsTutorials/ExcludedDayReducer.ts
import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  name: ''
}

const initialState = {
  // =========
  // DATA
  // =========
  id: null,
  excludedDays: [],

  // =========
  // FILTERS
  // =========
  filters: initialFilters,
  appliedFilters: initialFilters,

  // =========
  // UI MODAL
  // =========
  modalOpen: false,
  modalMode: 'view', // (lo mantengo por compat)
  // ✅ NUEVO: modo interno del modal (tu viejo código usa "create" / "info")
  modalStatus: 'info',

  // ✅ NUEVO (por compat con tu antiguo código que usaba showModal)
  showModal: false,
  showEliminateDialog: false
}

const excludedDaySlice = createSlice({
  name: 'excludedDay',
  initialState,
  reducers: {
    // =================
    // ID / LIST
    // =================
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },

    // ✅ alias por compat (tu código antiguo lo llama así)
    setExcludedDayId(state, action) {
      state.id = action.payload
    },

    setExcludedDays(state, action) {
      state.excludedDays = action.payload
    },

    addExcludedDayToList(state, action) {
      state.excludedDays = [action.payload, ...(state.excludedDays ?? [])]
    },

    updateExcludedDayInList(state, action) {
      const updated = action.payload
      state.excludedDays = (state.excludedDays ?? []).map(et => (Number(et?.id) === Number(updated?.id) ? updated : et))
    },

    removeExcludedDayFromList(state, action) {
      const removeId = action.payload
      state.excludedDays = (state.excludedDays ?? []).filter(et => Number(et?.id) !== Number(removeId))
    },

    // =================
    // MODAL (nuevo estilo y compat)
    // =================
    openModal(state, action) {
      state.modalOpen = true
      state.showModal = true

      state.modalMode = action.payload.mode

      // opcional: mapeo automático
      state.modalStatus = action.payload.mode === 'create' ? 'create' : action.payload.mode === 'edit' ? 'edit' : 'info'

      if (action.payload.excludedDayId !== undefined) {
        state.id = action.payload.excludedDayId
      }
    },

    closeExcludedDayModal(state) {
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

export const excludedDayActions = excludedDaySlice.actions
export default excludedDaySlice.reducer
