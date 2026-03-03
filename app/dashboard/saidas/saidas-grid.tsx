'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { MonthFilter } from '@/components/forms/month-filter'
import { TransactionForm } from '@/components/forms/transaction-form'
import type { Category } from '@prisma/client'

interface CreditCard {
  id: string
  name: string
  lastFour: string | null
  limit: number
  color: string | null
}

interface SaidasGridProps {
  monthLabel: string
  month: number
  year: number
  daysInMonth: number
  categories: Category[]
  creditCards: CreditCard[]
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

export function SaidasGrid({
  monthLabel,
  month,
  year,
  daysInMonth,
  categories,
  creditCards,
  action,
}: SaidasGridProps) {
  const now = new Date()
  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year
  const defaultDay = isCurrentMonth ? now.getDate() : 1
  const [selectedDay, setSelectedDay] = useState(defaultDay)

  const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[340px,1fr] gap-6">
      <div className="space-y-4">
        <Card className="border-primary/40 bg-primary/5 h-fit">
          <CardContent className="flex flex-col gap-4 py-4">
            <div>
              <p className="text-xs font-medium uppercase text-primary/70 tracking-wide">
                Mês em edição
              </p>
              <p className="text-lg font-semibold">{monthLabel}</p>
            </div>
            <div className="w-full">
              <MonthFilter />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/40 bg-primary/5 h-fit">
          <CardContent className="flex flex-col gap-4 py-4">
            <div>
              <p className="text-xs font-medium uppercase text-primary/70 tracking-wide">
                Dia para lançamento
              </p>
            </div>
            <div className="w-full">
              <Label htmlFor="day-select" className="sr-only">
                Selecionar dia
              </Label>
              <Select
                id="day-select"
                value={String(selectedDay)}
                onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                className="w-full"
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    Dia {String(day).padStart(2, '0')}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adicionar saída</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            type="expense"
            categories={categories}
            creditCards={creditCards}
            action={action}
            dateValue={dateValue}
          />
        </CardContent>
      </Card>
    </div>
  )
}
