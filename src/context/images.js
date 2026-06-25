// Converts base64 image to Blob
export const convertToBlob = image => {
  const base64Image = image.split(',')[1] // Remove 'data:image/png;base64,' part
  const byteString = atob(base64Image) // Decode base64 string to binary
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uintArray = new Uint8Array(arrayBuffer)

  for (let i = 0; i < byteString.length; i++) {
    uintArray[i] = byteString.charCodeAt(i) // Convert to char codes
  }

  // Create a Blob from the Uint8Array, with MIME type 'image/png'
  return new Blob([uintArray], { type: 'image/png' })
}
