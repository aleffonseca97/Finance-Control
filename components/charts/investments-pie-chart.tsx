'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type InvestmentPieDatum = {
  name: string
  value: number
  color?: string | null
}

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#a855f7']

export function InvestmentsPieChart({ data }: { data: InvestmentPieDatum[] }) {
  const filtered = data.filter((d) => d.value > 0)

  if (filtered.length === 0) {
    return (
      <div className="flex h-[220px] w-full items-center justify-center text-center text-sm text-muted-foreground sm:h-[260px]">
        Adicione investimentos para ver o gráfico
      </div>
    )
  }

  return (
    <div className="h-[220px] w-full sm:h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {filtered.map((entry, index) => (
              <Cell
                key={`${entry.name}-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) =>
              `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

