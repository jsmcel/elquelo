'use client'

import clsx from 'clsx'
import { useState } from 'react'

interface SwitchProps {
  checked: boolean
  disabled?: boolean
  onCheckedChange?: (value: boolean) => void
}

export function Switch({ checked, disabled, onCheckedChange }: SwitchProps) {
  const [focusVisible, setFocusVisible] = useState(false)

  return (
    <button
      type="button"
      className={clsx(
        'relative inline-flex h-6 w-11 items-center rounded-full border transition',
        checked ? 'border-primary-400 bg-primary-500' : 'border-gray-200 bg-gray-200',
        disabled ? 'cursor-not-allowed opacity-60' : 'focus:outline-none focus:ring-2 focus:ring-primary-300'
      )}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      onKeyDown={(event) => {
        if (disabled) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onCheckedChange?.(!checked)
        }
      }}
      onFocus={() => setFocusVisible(true)}
      onBlur={() => setFocusVisible(false)}
      aria-pressed={checked}
      disabled={disabled}
    >
      <span
        className={clsx(
          'inline-block h-5 w-5 transform rounded-full bg-white transition',
          checked ? 'translate-x-5' : 'translate-x-1',
          focusVisible ? 'ring-2 ring-white ring-offset-2 ring-offset-primary-400' : undefined
        )}
      />
    </button>
  )
}
