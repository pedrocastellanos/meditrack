import { NavLink } from 'react-router'
import { useThemeStore } from '@/store/themeStore'
import Icon from '@/components/ui/Icon'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/inventario', label: 'Inventario' },
  { to: '/alertas', label: 'Alertas' }
]

export default function Navbar() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  return (
    <nav className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg shadow-gray-200/50 dark:shadow-black/20 sticky top-0 z-50 transition-colors duration-300 border-b border-gray-100 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2.5 text-xl font-bold text-teal-600 dark:text-teal-400 font-[family-name:var(--font-headline)] tracking-tight">
            <Icon name="pill" className="w-7 h-7" />
            <span>MediTrack</span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="md:hidden flex items-center justify-center gap-1 pb-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
