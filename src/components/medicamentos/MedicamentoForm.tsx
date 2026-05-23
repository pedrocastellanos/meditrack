import { useForm } from '../../hooks/useForm'
import { z } from 'zod'
import type { Medicamento } from '../../data/types'
import { CATEGORIAS, PRESENTACIONES } from '../../data/constants'
import { useMedicamentosStore } from '../../store/medicamentosStore'
import { useNotification } from '../../hooks/useNotification'
import ToastContainer from '../notificaciones/ToastContainer'

const formSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  principioActivo: z.string().min(1, 'Campo requerido'),
  categoria: z.string().min(1, 'Seleccione una categoría'),
  presentacion: z.string().min(1, 'Seleccione una presentación'),
  laboratorio: z.string().min(1, 'Campo requerido'),
  precioCompra: z.number().min(1, 'Debe ser mayor a 0'),
  precioVenta: z.number().min(1, 'Debe ser mayor a 0'),
  stock: z.number().min(0, 'No puede ser negativo'),
  stockMinimo: z.number().min(0, 'No puede ser negativo'),
  fechaVencimiento: z.string().min(1, 'Campo requerido'),
  lote: z.string().min(4, 'Mínimo 4 caracteres'),
  requiereReceta: z.boolean(),
  ubicacion: z.string().optional(),
  notas: z.string().optional()
})

type MedicamentoFormValues = z.infer<typeof formSchema>

const getSchema = (medicamentos: Medicamento[], excludeId?: string) =>
  formSchema.refine(
    (data) => data.precioVenta > data.precioCompra,
    { message: 'El precio de venta debe ser mayor al de compra', path: ['precioVenta'] }
  ).refine(
    (data) => data.stockMinimo <= data.stock,
    { message: 'No puede ser superior al stock inicial', path: ['stockMinimo'] }
  ).refine(
    (data) => new Date(data.fechaVencimiento) > new Date(),
    { message: 'Debe ser una fecha futura', path: ['fechaVencimiento'] }
  ).refine(
    (val) => {
      const nombreLower = val.nombre.toLowerCase().trim()
      return !medicamentos.some(
        (m) => m.nombre.toLowerCase().trim() === nombreLower && m.id !== excludeId
      )
    },
    { message: 'Este nombre ya está registrado', path: ['nombre'] }
  )

interface Props {
  medicamento?: Medicamento
  onSubmitSuccess?: () => void
}

export default function MedicamentoForm({ medicamento, onSubmitSuccess }: Props) {
  const { medicamentos, agregarMedicamento, actualizarMedicamento } = useMedicamentosStore()
  const { notificaciones, notificar, eliminar } = useNotification()

  const defaultValues: MedicamentoFormValues = medicamento ? {
    nombre: medicamento.nombre,
    principioActivo: medicamento.principioActivo,
    categoria: medicamento.categoria,
    presentacion: medicamento.presentacion,
    laboratorio: medicamento.laboratorio,
    precioCompra: medicamento.precioCompra,
    precioVenta: medicamento.precioVenta,
    stock: medicamento.stock,
    stockMinimo: medicamento.stockMinimo,
    fechaVencimiento: medicamento.fechaVencimiento,
    lote: medicamento.lote,
    requiereReceta: medicamento.requiereReceta,
    ubicacion: medicamento.ubicacion,
    notas: medicamento.notas
  } : {
    nombre: '',
    principioActivo: '',
    categoria: '',
    presentacion: '',
    laboratorio: '',
    precioCompra: 0,
    precioVenta: 0,
    stock: 0,
    stockMinimo: 5,
    fechaVencimiento: '',
    lote: '',
    requiereReceta: false,
    ubicacion: '',
    notas: ''
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm(
    getSchema(medicamentos, medicamento?.id),
    defaultValues
  )

  const stockValue = watch('stock')

  const onSubmit = (data: MedicamentoFormValues) => {
    const formData = {
      ...data,
      ubicacion: data.ubicacion || '',
      notas: data.notas || ''
    }
    if (medicamento) {
      actualizarMedicamento(medicamento.id, formData)
      notificar('Medicamento actualizado correctamente', 'exito')
    } else {
      agregarMedicamento(formData)
      notificar('Medicamento registrado correctamente', 'exito')
      reset()
    }
    onSubmitSuccess?.()
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
      hasError
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2`

  return (
    <>
      <ToastContainer notificaciones={notificaciones} onEliminar={eliminar} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input {...register('nombre')} className={inputClass(!!errors.nombre)} placeholder="Nombre comercial" />
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Principio Activo</label>
              <input {...register('principioActivo')} className={inputClass(!!errors.principioActivo)} placeholder="Ej. Paracetamol" />
              {errors.principioActivo && <p className="text-red-500 text-xs mt-1">{errors.principioActivo.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
              <select {...register('categoria')} className={inputClass(!!errors.categoria)}>
                <option value="">Seleccionar...</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Presentación</label>
              <select {...register('presentacion')} className={inputClass(!!errors.presentacion)}>
                <option value="">Seleccionar...</option>
                {PRESENTACIONES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.presentacion && <p className="text-red-500 text-xs mt-1">{errors.presentacion.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Laboratorio</label>
              <input {...register('laboratorio')} className={inputClass(!!errors.laboratorio)} placeholder="Nombre del laboratorio" />
              {errors.laboratorio && <p className="text-red-500 text-xs mt-1">{errors.laboratorio.message}</p>}
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información Comercial</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio de Compra ($)</label>
              <input type="number" {...register('precioCompra', { valueAsNumber: true })} className={inputClass(!!errors.precioCompra)} />
              {errors.precioCompra && <p className="text-red-500 text-xs mt-1">{errors.precioCompra.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio de Venta ($)</label>
              <input type="number" {...register('precioVenta', { valueAsNumber: true })} className={inputClass(!!errors.precioVenta)} />
              {errors.precioVenta && <p className="text-red-500 text-xs mt-1">{errors.precioVenta.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación Física</label>
              <input {...register('ubicacion')} className={inputClass(false)} placeholder="Ej. Estante A1, Gaveta B2" />
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información de Inventario</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Inicial</label>
              <input type="number" {...register('stock', { valueAsNumber: true })} className={inputClass(!!errors.stock)} />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Mínimo</label>
              <input type="number" {...register('stockMinimo', { valueAsNumber: true })} className={inputClass(!!errors.stockMinimo)} />
              <p className="text-xs text-gray-400 mt-1">Sugerido: 5. Máximo: {stockValue || 0}</p>
              {errors.stockMinimo && <p className="text-red-500 text-xs mt-1">{errors.stockMinimo.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lote</label>
              <input {...register('lote')} className={inputClass(!!errors.lote)} placeholder="Ej. LOT-2024-001" />
              {errors.lote && <p className="text-red-500 text-xs mt-1">{errors.lote.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Vencimiento</label>
              <input type="date" {...register('fechaVencimiento')} className={inputClass(!!errors.fechaVencimiento)} />
              {errors.fechaVencimiento && <p className="text-red-500 text-xs mt-1">{errors.fechaVencimiento.message}</p>}
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="requiereReceta" {...register('requiereReceta')} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <label htmlFor="requiereReceta" className="text-sm text-gray-700 dark:text-gray-300">Requiere receta médica</label>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notas Adicionales</h2>
          <textarea
            {...register('notas')}
            rows={3}
            className={inputClass(false)}
            placeholder="Contraindicaciones, observaciones..."
          />
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={!isValid}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {medicamento ? 'Actualizar Medicamento' : 'Registrar Medicamento'}
          </button>
        </div>
      </form>
    </>
  )
}
