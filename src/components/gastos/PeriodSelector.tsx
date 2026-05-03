'use client'

import { useMemo } from 'react'

interface PeriodSelectorProps {
  value: string
  onChange: (period: string) => void
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  // Generar opciones de períodos (últimos 12 meses)
  const periods = useMemo(() => {
    const options = [{ value: '', label: 'Sin período' }]
    const now = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const period = `${year}-${month.toString().padStart(2, '0')}`
      const label = `${MONTHS[date.getMonth()]} ${year}`
      options.push({ value: period, label })
    }
    
    return options
  }, [])

  return (
    <div className="space-y-2">
      <label className="label">Período Contable</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      >
        {periods.map(p => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  )
}