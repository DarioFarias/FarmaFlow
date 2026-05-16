import { describe, it, expect } from 'vitest'
import { BatchAction, BatchResult, BatchResultItem } from '@/types'

describe('BatchAction Type', () => {
  it('should allow approve action', () => {
    const action: BatchAction = 'approve'
    expect(action).toBe('approve')
  })

  it('should allow report action', () => {
    const action: BatchAction = 'report'
    expect(action).toBe('report')
  })

  it('should allow return action', () => {
    const action: BatchAction = 'return'
    expect(action).toBe('return')
  })
})

describe('BatchResult Interface', () => {
  it('should have correct shape for successful result', () => {
    const result: BatchResult = {
      processed: 2,
      failed: 1,
      total: 3,
      results: [
        { id: 'expense-1', success: true },
        { id: 'expense-2', success: true },
        { id: 'expense-3', success: false, error: 'No encontrado' },
      ],
    }

    expect(result.processed).toBe(2)
    expect(result.failed).toBe(1)
    expect(result.total).toBe(3)
    expect(result.results).toHaveLength(3)
  })

  it('should allow error property on failed items', () => {
    const resultItem: BatchResultItem = {
      id: 'expense-1',
      success: false,
      error: 'Falta pdfUrl o xmlUrl',
    }

    expect(resultItem.success).toBe(false)
    expect(resultItem.error).toBeDefined()
  })
})