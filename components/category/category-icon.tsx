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
  LucideIcon,
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
}

interface CategoryIconProps {
  icon: string
  className?: string
  size?: number
}

export function CategoryIcon({ icon, className, size = 20 }: CategoryIconProps) {
  const IconComponent = iconMap[icon] ?? CircleDollarSign
  return <IconComponent className={cn('shrink-0', className)} size={size} />
}
