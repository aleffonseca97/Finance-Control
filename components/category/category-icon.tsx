import {
  Wallet,
  Coins,
  Laptop,
  CircleDollarSign,
  ShoppingCart,
  Shirt,
  Gamepad2,
  Car,
  Home,
  Receipt,
  CreditCard,
  Shield,
  Plane,
  PiggyBank,
  Landmark,
  TrendingUp,
  Utensils,
  Heart,
  Zap,
  Wifi,
  Smartphone,
  Book,
  GraduationCap,
  Stethoscope,
  Baby,
  Gift,
  Bus,
  Fuel,
  LucideIcon,
  Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  Wallet,
  Coins,
  Laptop,
  CircleDollarSign,
  ShoppingCart,
  Shirt,
  Gamepad2,
  Car,
  Home,
  Receipt,
  CreditCard,
  Shield,
  Plane,
  PiggyBank,
  Landmark,
  TrendingUp,
  Utensils,
  Heart,
  Zap,
  Wifi,
  Smartphone,
  Book,
  GraduationCap,
  Stethoscope,
  Baby,
  Gift,
  Bus,
  Fuel,
  Video
}

export const CATEGORY_ICONS = [
  'Wallet',
  'Coins',
  'Laptop',
  'CircleDollarSign',
  'ShoppingCart',
  'Shirt',
  'Gamepad2',
  'Car',
  'Home',
  'Receipt',
  'CreditCard',
  'Shield',
  'Plane',
  'PiggyBank',
  'Landmark',
  'TrendingUp',
  'Utensils',
  'Heart',
  'Zap',
  'Wifi',
  'Smartphone',
  'Book',
  'GraduationCap',
  'Stethoscope',
  'Baby',
  'Gift',
  'Bus',
  'Fuel',
  'Video',
] as const

interface CategoryIconProps {
  icon: string
  className?: string
  size?: number
}

export function CategoryIcon({ icon, className, size = 20 }: CategoryIconProps) {
  const IconComponent = iconMap[icon] ?? CircleDollarSign
  return <IconComponent className={cn('shrink-0', className)} size={size} />
}
