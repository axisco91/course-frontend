import { createSlice } from '@reduxjs/toolkit'

// Año
const getCurrentYear = new Date().getFullYear()

// Reducer donde se guarda los datos de los festivos
const festivalSlice = createSlice({
  name: 'festival',
  initialState: {
    id: null,
    festivals: [],
    festival: null,
    years: [],
    year: getCurrentYear,
    searchText: ''
  },
  reducers: {
    // Asignamos el id
    setId(state, action) {
      state.id = action.payload
    },

    // Asignamos los festivos
    setFestivals(state, action) {
      state.festivals = action.payload
    },
    setFestival(state, action) {
      state.festival = action.payload
    },

    // Asignamos los años
    setYears(state, action) {
      state.years = action.payload
    },

    // Cambiamos el año seleccionado
    setYear(state, action) {
      state.year = action.payload
    },
    setSearchText(state, action) {
      state.searchText = action.payload
    }
  }
})

export const festivalActions = festivalSlice.actions

export default festivalSlice.reducer
