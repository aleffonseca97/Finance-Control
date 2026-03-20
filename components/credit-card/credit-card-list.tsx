'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCardForm } from './credit-card-form';
import { CreditCardPayForm } from './credit-card-pay-form';
import {
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
} from '@/app/actions/credit-cards';
import type { SerializedCreditCardOverdue } from '@/app/actions/credit-cards';
import type { CreditCard } from '@prisma/client';
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard as CreditCardIcon,
  Banknote,
  AlertTriangle,
} from 'lucide-react';

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

interface CreditCardListProps {
  cards: CreditCard[];
  availableCash: number;
  overdueNotices: SerializedCreditCardOverdue[];
}

export function CreditCardList({
  cards,
  availableCash,
  overdueNotices,
}: CreditCardListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payOpenId, setPayOpenId] = useState<string | null>(null);

  const editingCard = editingId ? cards.find((c) => c.id === editingId) : null;

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este cartão?')) return;
    await deleteCreditCard(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Meus cartões</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo cartão
        </Button>
      </div>

      {overdueNotices.length > 0 ? (
        <div
          role="status"
          className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-3 text-sm"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div className="space-y-1 min-w-0">
            <p className="font-semibold text-destructive">
              Fatura do cartão em atraso
            </p>
            <ul className="list-disc pl-4 text-muted-foreground space-y-1">
              {overdueNotices.map((n) => (
                <li key={`${n.cardId}-${n.closingLabel}`}>
                  <span className="text-foreground font-medium">{n.cardName}</span>
                  {n.lastFour ? ` •••• ${n.lastFour}` : ''}: R${' '}
                  {n.unpaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em
                  aberto (venc. {n.dueDateLabel}, fech. {n.closingLabel})
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground rounded-md border bg-muted/20 px-3 py-2">
        Compras no cartão <strong>não entram no orçamento</strong> até o fechamento:
        no dia seguinte ao fechamento é lançada a fatura como{' '}
        <strong>despesa variável</strong>
        (valor em aberto no ciclo). O botão <strong>Pagar</strong> usa só o saldo em
        caixa e <strong>restaura o limite</strong>. Após o vencimento, com saldo em
        aberto, você verá o alerta de atraso.
      </p>

      {(showForm || editingId) && (
        <CreditCardForm
          initialCard={editingCard ?? undefined}
          createAction={createCreditCard}
          updateAction={updateCreditCard}
          onCancel={handleCancel}
        />
      )}

      <div className="space-y-2">
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum cartão cadastrado. Clique em &quot;Novo cartão&quot; para começar.
          </p>
        ) : (
          cards.map((card) => {
            const total = card.totalLimit ?? card.limit;
            const available = card.limit;
            const used = roundMoney(Math.max(0, total - available));
            const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
            const maxPay = used;

            return (
              <div
                key={card.id}
                className="rounded-lg border bg-card hover:bg-muted/50 overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="rounded-lg p-3 shrink-0"
                      style={{ backgroundColor: `${card.color}20` }}
                    >
                      <CreditCardIcon
                        className="text-foreground"
                        size={24}
                        style={{ color: card.color ?? undefined }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {card.name}
                        {card.lastFour ? (
                          <span className="ml-2 text-muted-foreground">
                            •••• {card.lastFour}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total R${' '}
                        {total.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                        {' · '}
                        Disponível R${' '}
                        {available.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                        {' · '}
                        Fech. dia {card.closingDay} · Venc. dia {card.dueDay}
                      </p>
                      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden max-w-md">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: card.color ?? '#6366f1',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        setPayOpenId(payOpenId === card.id ? null : card.id)
                      }
                      disabled={maxPay <= 0}
                    >
                      <Banknote className="h-3.5 w-3.5 mr-1.5" />
                      Pagar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setShowForm(false);
                        setPayOpenId(null);
                        setEditingId(editingId === card.id ? null : card.id);
                      }}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(card.id)}
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {payOpenId === card.id ? (
                  <div className="px-4 pb-4">
                    <CreditCardPayForm
                      card={card}
                      availableCash={availableCash}
                      maxPay={maxPay}
                      onDone={() => setPayOpenId(null)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
