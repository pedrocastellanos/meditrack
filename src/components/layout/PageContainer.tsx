import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
  action?: ReactNode
}

export default function PageContainer({ title, children, action }: Props) {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {action && <div>{action}</div>}
      </div>
      {children}
    </main>
  )
}
