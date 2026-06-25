import React, { KeyboardEvent, ReactNode, useRef } from 'react'
import CustomAccordion from './CustomAccordion'

interface FilterProps {
  children: ReactNode
  actions?: ReactNode
  onEnter?: () => void
}

type ActionElementProps = {
  children?: ReactNode
  color?: string
  onClick?: () => void
  type?: string
  'data-filter-button'?: string | boolean
}

function Filter({ children, actions, onEnter }: FilterProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const findFilterAction = (node: ReactNode): (() => void) | null => {
    let action: (() => void) | null = null

    React.Children.forEach(node, child => {
      if (action || !React.isValidElement<ActionElementProps>(child)) return

      const props = child.props
      const isFilterAction =
        props['data-filter-button'] === true ||
        props['data-filter-button'] === 'true' ||
        props.color === 'success' ||
        props.type === 'submit'

      if (isFilterAction && typeof props.onClick === 'function') {
        action = props.onClick

        return
      }

      action = findFilterAction(props.children)
    })

    return action
  }

  const findFilterButton = () => {
    const buttons = Array.from(containerRef.current?.querySelectorAll('button') ?? []) as HTMLButtonElement[]

    return buttons.find(button => {
      const text = (button.textContent ?? '').trim().toLowerCase()

      return (
        button.dataset.filterButton === 'true' ||
        text.includes('filter') ||
        text.includes('filtrar') ||
        button.className.includes('MuiButton-colorSuccess')
      )
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || event.defaultPrevented || event.nativeEvent.isComposing) return

    const target = event.target as HTMLElement | null
    const isInputLike = target?.tagName === 'INPUT' || target?.tagName === 'SELECT' || target?.getAttribute('role') === 'combobox'

    if (!isInputLike) return
    if (target?.tagName === 'TEXTAREA') return
    if (target?.getAttribute('aria-expanded') === 'true') return

    const filterAction = onEnter ?? findFilterAction(actions)
    if (filterAction) {
      event.preventDefault()
      filterAction()

      return
    }

    const button = findFilterButton()
    if (!button || button.disabled) return

    event.preventDefault()
    button.click()
  }

  return (
    <div ref={containerRef} onKeyDownCapture={handleKeyDown}>
      <CustomAccordion title='Filters' actions={actions}>
        {children}
      </CustomAccordion>
    </div>
  )
}

export default Filter
