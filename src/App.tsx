import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router'
import { useMedicamentosStore } from '@/store/medicamentosStore'
import { useThemeStore } from '@/store/themeStore'
import Navbar from '@/components/layout/Navbar'
import PageContainer from '@/components/layout/PageContainer'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Inventario = lazy(() => import('@/pages/Inventario'))
const DetalleMedicamento = lazy(() => import('@/pages/DetalleMedicamento'))
const NuevoMedicamento = lazy(() => import('@/pages/NuevoMedicamento'))
const EditarMedicamento = lazy(() => import('@/pages/EditarMedicamento'))
const Alertas = lazy(() => import('@/pages/Alertas'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent" />
    </div>
  )
}

export default function App() {
  const loadInitialData = useMedicamentosStore((s) => s.loadInitialData)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-white dark:bg-gray-950 dark:from-gray-950 dark:to-gray-900 transition-colors duration-300">
        <Navbar />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<PageContainer title="Panel de Control"><Dashboard /></PageContainer>} />
            <Route path="/inventario" element={
              <PageContainer
                title="Inventario de Medicamentos"
                action={
                  <Link
                    to="/inventario/nuevo"
                    className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                  >
                    + Nuevo Medicamento
                  </Link>
                }
              >
                <Inventario />
              </PageContainer>
            } />
            <Route path="/inventario/nuevo" element={
              <PageContainer
                title="Registrar Medicamento"
                action={
                  <Link to="/inventario" className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium">
                    ← Volver
                  </Link>
                }
              >
                <NuevoMedicamento />
              </PageContainer>
            } />
            <Route path="/inventario/:id" element={<DetalleMedicamentoWrapper />} />
            <Route path="/inventario/:id/editar" element={
              <PageContainer
                title="Editar Medicamento"
                action={
                  <Link to="/inventario" className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium">
                    ← Volver
                  </Link>
                }
              >
                <EditarMedicamento />
              </PageContainer>
            } />
            <Route path="/alertas" element={<PageContainer title="Alertas y Notificaciones"><Alertas /></PageContainer>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}

function DetalleMedicamentoWrapper() {
  return (
    <PageContainer title="">
      <DetalleMedicamento />
    </PageContainer>
  )
}
