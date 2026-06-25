import React, { useEffect, useRef } from 'react'
import { useLoadScript, Libraries } from '@react-google-maps/api'
import CustomTextField from './CustomTextField'

const libraries: Libraries = ['places']

interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  label: string
  id: string
  error?: boolean
  helperText?: string
  disabled: boolean
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  value,
  onChange,
  label,
  id,
  error,
  helperText,
  disabled
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyBvobrEf2HsYoF9Pt_rj6pP0GA7rej3ncA',
    libraries
  })

  const autocompleteRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoaded || !autocompleteRef.current) return

    const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
      fields: ['address_components', 'formatted_address'],
      types: ['geocode']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.address_components) {
        for (let i = 0; i < place.address_components.length; i++) {
          for (let j = 0; j < place.address_components[i].types.length; j++) {
            if (place.address_components[i].types[j] === 'postal_code') {
              // Handle postal code
            }
          }
        }

        // When a road name (or any place) is selected
        onChange(place.formatted_address || '')
      }
    })

    return () => {
      // Clean up the event listener
      window.google.maps.event.clearInstanceListeners(autocomplete)
    }
  }, [isLoaded, onChange])

  if (loadError) return <div>Error loading maps</div>
  if (!isLoaded) return <div>Loading maps...</div>

  return (
    <CustomTextField
      fullWidth
      value={value}
      onChange={e => onChange(e.target.value)}
      label={label}
      id={id}
      placeholder={label}
      error={error}
      helperText={helperText}
      disabled={disabled}
      inputRef={autocompleteRef}
    />
  )
}

export default PlacesAutocomplete
