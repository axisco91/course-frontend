// src/reducers/examsTutorials/ExamTutorialReducer.ts
import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  name: ''
}

const initialState = {
  // =========
  // DATA
  // =========
  id: null,

  // ✅ fuente de verdad
  examTutorials: [],

  // ✅ compat con tu código nuevo que lee examsTutorials
  examsTutorials: [],

  // =========
  // FILTERS
  // =========
  filters: initialFilters,
  appliedFilters: initialFilters,

  // =========
  // UI MODAL
  // =========
  modalOpen: false,
  modalMode: 'view',
  modalStatus: 'info',

  // ✅ compat con tu antiguo código que usaba showModal
  showModal: false
}

const syncLists = state => {
  // Mantener ambas listas iguales (compat)
  state.examsTutorials = state.examTutorials
}

const examTutorialSlice = createSlice({
  name: 'examTutorial',
  initialState,
  reducers: {
    // =================
    // ID
    // =================
    setId(state, action) {
      state.id = action.payload
    },

    // ✅ alias por compat (tu código lo llama así)
    setExamTutorialId(state, action) {
      state.id = action.payload
    },

    // =================
    // LIST
    // =================
    setExamTutorials(state, action) {
      state.examTutorials = Array.isArray(action.payload) ? action.payload : []
      syncLists(state)
    },

    // ✅ alias por compat con tu selector "examsTutorials"
    setExamsTutorials(state, action) {
      state.examTutorials = Array.isArray(action.payload) ? action.payload : []
      syncLists(state)
    },

    addExamTutorialToList(state, action) {
      state.examTutorials = [action.payload, ...(state.examTutorials ?? [])]
      syncLists(state)
    },

    // ✅ alias clásico: addExamTutorial(...)
    addExamTutorial(state, action) {
      state.examTutorials = [action.payload, ...(state.examTutorials ?? [])]
      syncLists(state)
    },

    updateExamTutorialInList(state, action) {
      const updated = action.payload
      state.examTutorials = (state.examTutorials ?? []).map(et =>
        Number(et?.id) === Number(updated?.id) ? updated : et
      )
      syncLists(state)
    },

    // ✅ alias clásico: replaceExamTutorial(...)
    replaceExamTutorial(state, action) {
      const updated = action.payload
      state.examTutorials = (state.examTutorials ?? []).map(et =>
        Number(et?.id) === Number(updated?.id) ? updated : et
      )
      syncLists(state)
    },

    removeExamTutorialFromList(state, action) {
      const removeId = action.payload
      state.examTutorials = (state.examTutorials ?? []).filter(et => Number(et?.id) !== Number(removeId))
      syncLists(state)
    },

    // =================
    // MODAL
    // =================
    openModal(state, action) {
      state.modalOpen = true
      state.showModal = true

      state.modalMode = action.payload.mode

      // mapeo automático
      state.modalStatus = action.payload.mode === 'create' ? 'create' : action.payload.mode === 'edit' ? 'edit' : 'info'

      if (action.payload.examTutorialId !== undefined) {
        state.id = action.payload.examTutorialId
      }
    },

    closeExamTutorialModal(state) {
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

export const examTutorialActions = examTutorialSlice.actions
export default examTutorialSlice.reducer
