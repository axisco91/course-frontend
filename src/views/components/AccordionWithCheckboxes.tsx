import React, { Fragment, SyntheticEvent, useState } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Checkbox, FormControlLabel } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTranslation } from 'react-i18next'

interface Props {
  data: any[]
}

const AccordionWithCheckBox: React.FC<Props> = ({ data }) => {
  // Translation
  const { t } = useTranslation()

  // State for expanded accordion
  const [expanded, setExpanded] = useState<string | false>(false)

  // Function to handle accordion expansion
  const handleChange = (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  // Function to render accordions
  const renderAccordions = () => {
    return data.map(item => (
      <Accordion key={item.id} expanded={expanded === item.id} onChange={handleChange(item.id)}>
        <AccordionSummary expandIcon={<Icon fontSize='1.25rem' icon='tabler:chevron-down' />}>
          <FormControlLabel
            label={`${item.motive} ${item.start} - ${item.end} (${item.chargeable_year})`}
            control={<Checkbox disableRipple />}
          />
        </AccordionSummary>
        <AccordionDetails>
          {item.absence_requests.map(absence => (
            <FormControlLabel
              key={absence.date} // Ensure each FormControlLabel has a unique key
              label={`${absence.date}`}
              control={<Checkbox disableRipple />}
            />
          ))}
        </AccordionDetails>
      </Accordion>
    ))
  }

  return <Fragment>{renderAccordions()}</Fragment> // Wrapping the array of elements in a parent JSX element
}

export default AccordionWithCheckBox
