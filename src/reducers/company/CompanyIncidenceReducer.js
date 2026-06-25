import { createSlice } from '@reduxjs/toolkit'

const companyIncidenceSlice = createSlice({
  name: 'companyIncidence',
  initialState: {
    // ✅ lo que ya tenías
    id: null,
    companyIncidences: null,
    showEliminateDialog: false,

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
    setCompanyIncidences(state, action) {
      state.companyIncidences = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
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
    }
  }
})

export const companyIncidenceActions = companyIncidenceSlice.actions
export default companyIncidenceSlice.reducer
