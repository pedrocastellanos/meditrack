import { useForm as useRHF, type UseFormProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodType } from 'zod'

/**
 * Custom hook que abstrae la integración de React Hook Form con Zod.
 *
 * Centraliza la configuración de validación en tiempo real (mode: 'onChange')
 * y el resolver de Zod, evitando repetir esta configuración en cada formulario.
 * Permite que cualquier componente de formulario consuma validación tipada
 * sin acoplarse a los detalles de implementación de RHF + Zod.
 */
export function useForm<T extends Record<string, unknown>>(
  schema: ZodType<T>,
  defaultValues: T,
  options?: Omit<UseFormProps<T>, 'resolver' | 'defaultValues'>
) {
  return useRHF<T>({
    mode: 'onChange',
    resolver: zodResolver(schema),
    defaultValues,
    ...options,
  })
}
