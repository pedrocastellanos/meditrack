import { useParams, useNavigate } from 'react-router'
import { useMedicamentosStore } from '../store/medicamentosStore'
import MedicamentoForm from '../components/medicamentos/MedicamentoForm'
import EmptyState from '../components/ui/EmptyState'

export default function EditarMedicamento() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const medicamento = useMedicamentosStore((s) => s.medicamentos.find((m) => m.id === id))

  if (!medicamento) {
    return (
      <EmptyState
        mensaje="Medicamento no encontrado"
        accion="Volver al inventario"
        icono="🔍"
      />
    )
  }

  return (
    <MedicamentoForm
      medicamento={medicamento}
      onSubmitSuccess={() => navigate(`/inventario/${medicamento.id}`)}
    />
  )
}
