import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  population_id: null,
    showEliminateDialog: false,
  festival_id: null
}

const initialState = {
  id: null,
  populationFestivals: [],
  currentPopulationFestival: null,
  filters: initialFilters,
  appliedFilters: initialFilters,
  modalOpen: false,
  modalMode: 'view'
}

const populationFestivalSlice = createSlice({
  name: 'populationFestival',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setPopulationFestivals(state, action) {
      state.populationFestivals = action.payload
    },
    setCurrentPopulationFestival(state, action) {
      state.currentPopulationFestival = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload?.mode ?? 'view'

      const modalId = action.payload?.populationFestivalId ?? action.payload?.id
      if (modalId !== undefined) state.id = modalId

      if (action.payload?.populationFestival !== undefined) {
        state.currentPopulationFestival = action.payload.populationFestival
      }
    },
    closeModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
      state.currentPopulationFestival = null
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
    }
  }
})

export const populationFestivalActions = populationFestivalSlice.actions
export default populationFestivalSlice.reducer
