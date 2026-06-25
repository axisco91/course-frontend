import { MenuItem } from '@mui/material'
import React from 'react'
import { formatDate, formatEUDate } from './dates'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// Si son forms simples en vez de hacer formData.append uno por uno se puede usar esto
export const appendDataToFormData = (formData, data) => {
  for (const key in data) {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key].toString())
    }
  }
}

// Para no tener tanto código para hacer las listas
export const normalSelectList = list => {
  return list.map(element => (
    <MenuItem key={element.id} sx={{ py: 2 }} value={element.id}>
      {element.name}
    </MenuItem>
  ))
}

export const normalSelectListWithoutId = (list, selected) => {
  return list.map(element => (
    <MenuItem key={element} sx={{ py: 2 }} value={element} selected={selected === element}>
      {element}
    </MenuItem>
  ))
}

export const normalSelectListWithoutId2 = list => {
  return list.map(element => (
    <MenuItem key={element} sx={{ py: 2 }} value={element}>
      {element}
    </MenuItem>
  ))
}

export const normalDateSelect = list => {
  return list.map(element => (
    <MenuItem key={element} sx={{ py: 2 }} value={formatDate(element)}>
      {formatEUDate(element)}
    </MenuItem>
  ))
}

// Para no tener tanto código para hacer las listas
export const iconSelectList = list => {
  return list.map(element => (
    <MenuItem key={element.id} sx={{ py: 2 }} value={element.id}>
      <Icon fontSize='1.25rem' icon={element.name} />
    </MenuItem>
  ))
}

export const serializeDate = date => {
  if (date) {
    return date.getTime()
  }

  return null
}

export const normalContractList = list => {
  return list.map(element => (
    <MenuItem key={element.id} sx={{ py: 2 }} value={element.id}>
      {element.name} {element.start} - {element.end}
    </MenuItem>
  ))
}

export const workerNameList = list => {
  return list.map(element => (
    <MenuItem key={element.id} sx={{ py: 2 }} value={element.id}>
      {element.full_name}
    </MenuItem>
  ))
}

export const deserializeDate = timestamp => new Date(timestamp)
