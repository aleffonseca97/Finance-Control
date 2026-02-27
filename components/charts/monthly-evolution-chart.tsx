'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = {
  income: '#22c55e',
  expense: '#ef4444',
  investment: '#3b82f6',
}

interface DataPoint {
  month: string
  income: number
  expense: number
  investment: number
}

export function MonthlyEvolutionChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `R$${v / 1000}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [
              `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              '',
            ]}
          />
          <Legend
            formatter={(value) => {
              const labels: Record<string, string> = {
                income: 'Entradas',
                expense: 'Saídas',
                investment: 'Investimentos',
              }
              return labels[value] ?? value
            }}
          />
          <Bar dataKey="income" fill={COLORS.income} name="income" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill={COLORS.expense} name="expense" radius={[4, 4, 0, 0]} />
          <Bar dataKey="investment" fill={COLORS.investment} name="investment" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
