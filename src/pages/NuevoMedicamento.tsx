import { useNavigate } from 'react-router'
import MedicamentoForm from '../components/medicamentos/MedicamentoForm'

export default function NuevoMedicamento() {
  const navigate = useNavigate()

  return (
    <MedicamentoForm onSubmitSuccess={() => navigate('/inventario')} />
  )
}
