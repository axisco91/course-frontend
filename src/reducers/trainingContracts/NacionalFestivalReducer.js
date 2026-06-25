// src/reducers/examsTutorials/NacionalFestivalReducer.ts
import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  name: '',
  day: ''
}

const initialState = {
  // =========
  // DATA
  // =========
  id: null,
  nacionalFestivals: [],

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

const nacionalFestivalSlice = createSlice({
  name: 'nacionalFestival',
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
    setNacionalFestivalId(state, action) {
      state.id = action.payload
    },

    setNacionalFestivals(state, action) {
      state.nacionalFestivals = action.payload
    },

    addNacionalFestivalToList(state, action) {
      state.nacionalFestivals = [action.payload, ...(state.nacionalFestivals ?? [])]
    },

    updateNacionalFestivalInList(state, action) {
      const updated = action.payload
      state.nacionalFestivals = (state.nacionalFestivals ?? []).map(et =>
        Number(et?.id) === Number(updated?.id) ? updated : et
      )
    },

    removeNacionalFestivalFromList(state, action) {
      const removeId = action.payload
      state.nacionalFestivals = (state.nacionalFestivals ?? []).filter(et => Number(et?.id) !== Number(removeId))
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

      if (action.payload.nacionalFestivalId !== undefined) {
        state.id = action.payload.nacionalFestivalId
      }
    },

    closeNacionalFestivalModal(state) {
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

export const nacionalFestivalActions = nacionalFestivalSlice.actions
export default nacionalFestivalSlice.reducer
