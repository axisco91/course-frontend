// Detecta el color del fondo para cambiar el color del text si negro o blanco
const isColorDark = (hexColor: string): boolean => {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Formula to calculate brightness (luminance)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  // Colors with brightness less than 128 are considered dark
  return brightness < 128
}

export default isColorDark
