import React, { Component } from 'react'
import toast from 'react-hot-toast'
import { AuthContext } from 'src/context/AuthContext'

class ErrorBoundary extends Component {
  static contextType = AuthContext

  componentDidCatch(error, info) {
    const { logout } = this.context
    console.log(error, info)
    if (error.response) {
      if (error.response.status === 401) {
        // Log the user out if the response status is 401 (Unauthorized)
        logout()
        toast.error('Session expired. You have been logged out.', {
          position: 'top-right'
        })
      } else if (error.response.data.errors) {
        // Handle specific errors if necessary
      } else {
        const errorMessage = error.response.data.message
        toast.error(errorMessage, {
          position: 'top-right'
        })
      }
    } else {
      const errorMessage = 'Error with server, try again later'
      toast.error(errorMessage, {
        position: 'top-right'
      })
    }
  }

  render() {
    return this.props.children
  }
}

export default ErrorBoundary
