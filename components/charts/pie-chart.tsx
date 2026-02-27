'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#22c55e', '#ef4444', '#f59e0b'] // emerald, red, amber

interface DataPoint {
  name: string
  value: number
}

export function IncomeExpensePieChart({
  income,
  expense,
  creditCardExpense = 0,
}: {
  income: number
  expense: number
  creditCardExpense?: number
}) {
  const expenseWithoutCard = Math.max(0, expense - creditCardExpense)
  const data: DataPoint[] = [
    { name: 'Entradas', value: income },
    { name: 'Saídas', value: expenseWithoutCard },
    { name: 'Gastos Cartão', value: creditCardExpense },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        Adicione transações para ver o gráfico
      </div>
    )
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'white',
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
