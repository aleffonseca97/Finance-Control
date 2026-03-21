import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBRL } from '@/lib/date-utils'
import type { LucideIcon } from 'lucide-react'

type SummaryItem = {
  title: string
  value: number
  icon: LucideIcon
  color: string
  footnote?: string
}

type Props = {
  items: SummaryItem[]
}

export function SummaryCards({ items }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <Icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${item.color}`}>
                R$ {formatBRL(item.value)}
              </p>
              {item.footnote && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {item.footnote}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
