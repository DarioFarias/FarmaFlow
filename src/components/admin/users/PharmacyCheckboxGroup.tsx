'use client'

import { IPharmacy } from '@/types'
import clsx from 'clsx'

interface PharmacyCheckboxGroupProps {
  pharmacies: IPharmacy[]
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
}

export default function PharmacyCheckboxGroup({
  pharmacies,
  selected,
  onChange,
  disabled = false,
}: PharmacyCheckboxGroupProps) {
  if (pharmacies.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No hay farmacias registradas. Crea primero farmacias en /admin/farmacias.
      </p>
    )
  }

  const handleToggle = (pharmacyId: string) => {
    if (disabled) return
    
    if (selected.includes(pharmacyId)) {
      onChange(selected.filter((id) => id !== pharmacyId))
    } else {
      onChange([...selected, pharmacyId])
    }
  }

  return (
    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
      {pharmacies.map((pharmacy) => (
        <label
          key={pharmacy._id}
          className={clsx(
            'flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(pharmacy._id)}
            onChange={() => handleToggle(pharmacy._id)}
            disabled={disabled}
            className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
          />
          <span className="text-sm">
            <span className="font-semibold text-gray-900">{pharmacy.pharmacyName}</span>
          </span>
        </label>
      ))}
    </div>
  )
}