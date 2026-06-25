import * as yup from 'yup'

export const nifNIEValidation = t =>
  yup.string().test('nif-nie-validation', t('Invalid NIF/NIE number'), value => {
    if (!value) return true // Allow empty values, remove if empty values are not allowed

    const nifRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i // Regex for NIF
    const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i // Regex for NIE

    let numberPart = value

    if (nieRegex.test(value)) {
      // Convert NIE first letter to corresponding number
      const firstLetter = value.charAt(0).toUpperCase()
      const replacements = { X: '0', Y: '1', Z: '2' }
      numberPart = replacements[firstLetter] + value.slice(1)
    } else if (!nifRegex.test(value)) {
      return false // If it's not a valid NIF or NIE format, return false
    }

    // Validate control letter
    const letter = value.charAt(value.length - 1).toUpperCase()
    const letterMap = 'TRWAGMYFPDXBNJZSQVHLCKE'
    const index = parseInt(numberPart.slice(0, -1), 10) % 23

    return letter === letterMap.charAt(index)
  })
