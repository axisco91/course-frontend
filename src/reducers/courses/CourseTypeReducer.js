import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  id: null,
  courseTypes: [],

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const courseTypeSlice = createSlice({
  name: 'courseTypes',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setCourseTypes(state, action) {
      state.courseTypes = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeCourseTypeModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    }
  }
})

export const courseTypeActions = courseTypeSlice.actions
export default courseTypeSlice.reducer
