import { createSlice } from '@reduxjs/toolkit'

const quoteGroupSlice = createSlice({
  name: 'quoteGroup',
  initialState: {
    id: null,
    quoteGroups: [],
    searchText: ''
  },
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setQuoteGroups(state, action) {
      state.quoteGroups = action.payload
    },
    setSearchText(state, action) {
      state.searchText = action.payload
    }
  }
})

export const quoteGroupActions = quoteGroupSlice.actions

export default quoteGroupSlice.reducer
