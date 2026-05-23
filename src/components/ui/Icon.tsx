interface Props {
  name: IconName
  className?: string
}

export type IconName =
  | 'pill'
  | 'box'
  | 'dollar'
  | 'tag'
  | 'warning'
  | 'x-circle'
  | 'trash'
  | 'clock'
  | 'search'
  | 'check'
  | 'moon'
  | 'sun'
  | 'chevron-left'
  | 'plus'
  | 'edit'
  | 'filter'
  | 'empty-inbox'
  | 'empty-box'

const paths: Record<IconName, string> = {
  pill: 'M10.5 3.5a2.121 2.121 0 0 1 3 0l7 7a2.121 2.121 0 0 1 0 3l-7 7a2.121 2.121 0 0 1-3 0l-7-7a2.121 2.121 0 0 1 0-3l7-7Z M8.5 8.5l7 7',
  box: 'M20 7.5V17a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3.2-3l8.6.8a3 3 0 0 1 2.2 2.9V7.5ZM11 12v5 M8 12V7.5 M16 12v5 M13 12V7.5 M3.1 5 5.2 3 M18.9 8l2.1-2 M2 9.5h20',
  dollar: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  tag: 'M12 2H2v10l9.2 9.2a3 3 0 0 0 4.2 0l5.6-5.6a3 3 0 0 0 0-4.2Z M7 7h.01',
  warning: 'M10.3 1.9 1.3 18a2 2 0 0 0 1.7 3h18a2 2 0 0 0 1.7-3L13.7 1.9a2 2 0 0 0-3.4 0Z M12 9v4 M12 17h.01',
  'x-circle': 'M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10Z M15 9l-6 6 M9 9l6 6',
  trash: 'M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2 M10 11v6 M14 11v6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 6v6l4 2',
  search: 'M21 21l-4.3-4.3 M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
  check: 'M22 11.1V12a10 10 0 1 1-5.9-9.1 M22 4 12 14l-3-3',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  'chevron-left': 'M15 18l-6-6 6-6',
  plus: 'M12 5v14 M5 12h14',
  edit: 'M17 3a2.7 2.7 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z M15 5l4 4',
  filter: 'M22 3H2l8 9.5V19l4 2v-8.5Z',
  'empty-inbox': 'M22 12h-6l-2 3H10l-2-3H2 M5.5 17h13a2.9 2.9 0 0 0 2.1-.9l3.4-4.1V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6l3.4 4.1A2.9 2.9 0 0 0 5.5 17Z',
  'empty-box': 'M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7l8.7 5 8.7-5 M12 22V12',
}

export default function Icon({ name, className = 'w-5 h-5' }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
