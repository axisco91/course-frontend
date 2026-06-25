import React from 'react'

const MultilineCellRenderer = ({ value }) => {
  // Split the content into multiple lines
  const lines = value.split('\n')

  // Render each line in a separate <div>
  return (
    <div>
      {lines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  )
}

export default MultilineCellRenderer
