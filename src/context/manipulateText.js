// Método para calcular HH:MM desde minutos
export const truncateString = (str, maxLength) => {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...'
  }

  return str
}
