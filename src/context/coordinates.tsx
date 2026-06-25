const PDF_WIDTH_MM = 210
const PDF_HEIGHT_MM = 297

export const convertCoordinatesFromMMToPx = (coords, canvasWidth: number, canvasHeight: number) => {
  return coords.map(coord => ({
    ...coord,
    x: (coord.x / 210) * canvasWidth,
    y: (coord.y / 297) * canvasHeight
  }))
}

export const normalizeCoordinatesForPdf = (coordinates, canvasWidth: number, canvasHeight: number) => {
  return coordinates.map(coord => ({
    ...coord,
    x: (coord.x / canvasWidth) * PDF_WIDTH_MM,
    y: (coord.y / canvasHeight) * PDF_HEIGHT_MM
  }))
}
