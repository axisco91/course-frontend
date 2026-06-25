function getCurrentTimestampInSeconds() {
  return Math.floor(Date.now() / 1000)
}

// Custom Yup validation schema for NIF/NIE numbers
export const randomDateNumber = () => {
  const currentTimestampInSeconds = getCurrentTimestampInSeconds()
  const randomOffset = Math.floor(Math.random() * 1000000)

  return currentTimestampInSeconds + randomOffset
}
