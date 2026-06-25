import { createSlice } from '@reduxjs/toolkit'

const companyObservationSlice = createSlice({
  name: 'companyObservation',
  initialState: {
    // ✅ lo que ya tenías
    id: null,
    companyObservations: null,
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
    setCompanyObservations(state, action) {
      state.companyObservations = action.payload
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

export const companyObservationActions = companyObservationSlice.actions
export default companyObservationSlice.reducer
