import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  community_id: null,
    showEliminateDialog: false,
  festival_id: null
}

const initialState = {
  id: null,
  communityFestivals: [],
  currentCommunityFestival: null,
  filters: initialFilters,
  appliedFilters: initialFilters,
  modalOpen: false,
  modalMode: 'view'
}

const communityFestivalSlice = createSlice({
  name: 'communityFestival',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setCommunityFestivals(state, action) {
      state.communityFestivals = action.payload
    },
    setCurrentCommunityFestival(state, action) {
      state.currentCommunityFestival = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload?.mode ?? 'view'

      const modalId = action.payload?.communityFestivalId ?? action.payload?.id
      if (modalId !== undefined) state.id = modalId

      if (action.payload?.communityFestival !== undefined) {
        state.currentCommunityFestival = action.payload.communityFestival
      }
    },
    closeModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
      state.currentCommunityFestival = null
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

export const communityFestivalActions = communityFestivalSlice.actions
export default communityFestivalSlice.reducer
