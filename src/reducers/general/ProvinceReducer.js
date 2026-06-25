import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los generos
const provinceSlice = createSlice({
  name: 'province',
  initialState: {
    provinces: null,
    provincesWithFestivals: null
  },
  reducers: {
    setProvinces(state, action) {
      state.provinces = action.payload
    },
    setProvincesWithFestivals(state, action) {
      state.provincesWithFestivals = action.payload
    }
  }
})

export const provinceActions = provinceSlice.actions

export default provinceSlice.reducer
