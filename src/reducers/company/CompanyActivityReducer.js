import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: ''
}

// Reducer donde se guarda los datos de las empresas
const companyActivitySlice = createSlice({
  name: 'companyActivity',
  initialState: {
    id: null,
    companyActivities: null,
    filters: initialFilters, // draft (form)
    appliedFilters: initialFilters,

    // UI modal
    modalOpen: false,
    modalMode: 'view'
  },
  reducers: {
    // Asignamos el id
    setId(state, action) {
      state.id = action.payload
    },
    setCompanyActivities(state, action) {
      state.companyActivities = action.payload
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

export const companyActivityActions = companyActivitySlice.actions

export default companyActivitySlice.reducer
