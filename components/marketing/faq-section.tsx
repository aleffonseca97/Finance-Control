'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'O que acontece depois dos 3 meses grátis?',
    answer:
      'Após o período de teste, sua assinatura é cobrada automaticamente no cartão cadastrado no valor de R$10/mês. Você receberá um e-mail de lembrete com antecedência antes do fim do trial.',
  },
  {
    question: 'Preciso informar o cartão de crédito para começar?',
    answer:
      'Sim, o cartão é solicitado no cadastro para ativar o trial. Mas não há nenhuma cobrança nos primeiros 3 meses. A primeira cobrança ocorre somente após o fim do período gratuito.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer:
      'Sim, cancele quando quiser, sem multa ou taxa. Ao cancelar, seu acesso continua até o fim do período já pago. Não há fidelidade mínima.',
  },
  {
    question: 'Meus dados financeiros são seguros?',
    answer:
      'Seus dados são armazenados de forma segura e não são compartilhados com terceiros. Somente você tem acesso às suas informações financeiras.',
  },
  {
    question: 'Funciona em dispositivos móveis?',
    answer:
      'Sim, o Logos Finance é totalmente responsivo e funciona em smartphones, tablets e computadores. Acesse pelo navegador em qualquer dispositivo, sem precisar instalar nada.',
  },
  {
    question: 'Como funciona o controle de cartão de crédito?',
    answer:
      'Você cadastra seus cartões com limite total e datas de fechamento e vencimento. O sistema rastreia os gastos em tempo real, controla o limite disponível e ajuda a acompanhar o valor de cada fatura.',
  },
]

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 items-start">
          {/* Left: sticky title */}
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
              FAQ
            </p>
            <h2 className="text-3xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)] leading-tight">
              Perguntas frequentes.
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-sm leading-relaxed max-w-[28ch]">
              Ainda tem dúvidas? Fale com o suporte por e-mail.
            </p>
          </div>

          {/* Right: accordion */}
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  className="w-full py-5 flex items-center justify-between text-left gap-4 group"
                  onClick={() => setOpen(open === index ? null : index)}
                  aria-expanded={open === index}
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors duration-150 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200',
                      open === index && 'rotate-180'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200 ease-in-out',
                    open === index ? 'max-h-48 pb-5' : 'max-h-0'
                  )}
                >
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
