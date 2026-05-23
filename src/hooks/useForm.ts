import { useForm as useRHF } from 'react-hook-form'
import type { FieldValues, UseFormProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

/**
 * @param schema  Esquema Zod que define la forma y validaciones del formulario
 * @param defaultValues  Valores iniciales tipados según el esquema
 */
export function useForm<TFieldValues extends FieldValues>(
  schema: Parameters<typeof zodResolver>[0],
  defaultValues: TFieldValues
) {
  const options = {
    mode: 'onChange' as const,
    resolver: zodResolver(schema),
    defaultValues,
  }

  return useRHF<TFieldValues>(options as UseFormProps<TFieldValues>)
}
