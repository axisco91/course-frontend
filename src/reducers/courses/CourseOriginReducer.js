import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  id: null,
  courseOrigins: [],

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const courseOriginSlice = createSlice({
  name: 'courseOrigins',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setCourseOrigins(state, action) {
      state.courseOrigins = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeCourseOriginModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    }
  }
})

export const courseOriginActions = courseOriginSlice.actions
export default courseOriginSlice.reducer
