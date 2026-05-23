import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-8xl mb-6">404</span>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Página no encontrada</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">La página que buscas no existe o ha sido movida.</p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Volver al Dashboard
      </Link>
    </div>
  )
}
