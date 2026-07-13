import { Clock, FileCheck2, Files, Settings, Users } from 'lucide-react'

export const navigationItems = [
  {
    label: 'Generate',
    to: '/',
    icon: FileCheck2,
  },
  {
    label: 'Users',
    to: '/users',
    icon: Users,
  },
  {
    label: 'Templates',
    to: '/templates',
    icon: Files,
  },
  {
    label: 'History',
    to: '/history',
    icon: Clock,
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
  },
]
