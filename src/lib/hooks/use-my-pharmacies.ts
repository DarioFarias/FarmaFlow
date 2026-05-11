import { useQuery } from '@tanstack/react-query'

interface PharmacyOption {
  pharmacyId: string
  pharmacyName: string
}

interface UseMyPharmaciesResult {
  pharmacies: PharmacyOption[]
  isLoading: boolean
  error: Error | null
}

async function fetchMyPharmacies(): Promise<{ data: PharmacyOption[] }> {
  const response = await fetch('/api/my-pharmacies')
  
  if (!response.ok) {
    throw new Error('Error al obtener las farmacias')
  }
  
  return response.json()
}

/**
 * Hook for fetching user's assigned pharmacies with React Query caching.
 * Uses staleTime of 5 minutes (300 seconds) since pharmacy assignments
 * don't change frequently.
 */
export function useMyPharmacies(): UseMyPharmaciesResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-pharmacies'],
    queryFn: fetchMyPharmacies,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })

  return {
    pharmacies: data?.data || [],
    isLoading,
    error: error as Error | null,
  }
}