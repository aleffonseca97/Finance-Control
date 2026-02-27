export const DEFAULT_CATEGORIES = {
  income: [
    { name: 'Salário', icon: 'Wallet', color: '#22c55e' },
    { name: 'Extra', icon: 'Coins', color: '#eab308' },
    { name: 'Freelance', icon: 'Laptop', color: '#3b82f6' },
    { name: 'Outros', icon: 'CircleDollarSign', color: '#6366f1' },
  ],
  expense: [
    { name: 'Mercado', icon: 'ShoppingCart', color: '#22c55e', isFixed: false },
    { name: 'Roupas', icon: 'Shirt', color: '#ec4899', isFixed: false },
    { name: 'Lazer', icon: 'Gamepad2', color: '#f97316', isFixed: false },
    { name: 'Carro', icon: 'Car', color: '#06b6d4', isFixed: false },
    { name: 'Aluguel', icon: 'Home', color: '#8b5cf6', isFixed: true },
    { name: 'Contas', icon: 'Receipt', color: '#64748b', isFixed: true },
    { name: 'Outros', icon: 'CreditCard', color: '#6366f1', isFixed: false },
  ],
  investment: [
    { name: 'Reserva Emergência', icon: 'Shield', color: '#22c55e' },
    { name: 'Reserva Viagem', icon: 'Plane', color: '#3b82f6' },
    { name: 'CDB', icon: 'PiggyBank', color: '#eab308' },
    { name: 'Tesouro Direto', icon: 'Landmark', color: '#8b5cf6' },
    { name: 'Ações', icon: 'TrendingUp', color: '#06b6d4' },
    { name: 'Outros', icon: 'CircleDollarSign', color: '#6366f1' },
  ],
} as const
