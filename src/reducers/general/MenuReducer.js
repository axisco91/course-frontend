import { createSlice } from '@reduxjs/toolkit'

const menuUISlice = createSlice({
  name: 'menu',
  initialState: {
    menu: []
  },
  reducers: {
    setMenuUIData: (state, action) => {
      // Reemplaza todo el menú con lo que viene del backend
      state.menu = action.payload
    },
    updateMenuItemUI: (state, action) => {
      const { path, data } = action.payload
      const index = state.menu.findIndex(item => item.path === path)
      if (index !== -1) {
        state.menu[index] = { ...state.menu[index], ...data }
      }
    }
  }
})

export const menuActions = menuUISlice.actions
export default menuUISlice.reducer
