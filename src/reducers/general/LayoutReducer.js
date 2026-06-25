import { createSlice } from '@reduxjs/toolkit'

// Reducer donde guardamos los datos de layout
const layoutSlice = createSlice({
  name: 'layout',
  initialState: {
    logo: null,
    icon: null,
    title: '',
    backgroundImages: null,
    languages: [],
    ip: null,
    theme: {
      primary: null,
      secondary: null,
      success: null,
      warning: null,
      error: null
    }
  },
  reducers: {
    setLogo(state, action) {
      state.logo = action.payload
    },
    setIcon(state, action) {
      state.icon = action.payload
    },
    setTitle(state, action) {
      state.title = action.payload
    },
    setTheme(state, action) {
      state.theme = action.payload
    },
    setLanguages(state, action) {
      state.languages = action.payload
    },
    setIp(state, action) {
      state.ip = action.payload
    }
  }
})

export const layoutActions = layoutSlice.actions

export default layoutSlice.reducer
