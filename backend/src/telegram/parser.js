/**
 * Interpreta mensagens de texto como entrada ou saída.
 * Ex.: "entrada 100", "saída 50 mercado", "+200", "-30 lanche"
 */
export function parseMessage(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  // /vincular ou outros comandos não são transações
  if (trimmed.startsWith('/')) return null;

  // +100 ou +100,50
  const plusMatch = trimmed.match(/^\+?\s*(\d+([.,]\d{1,2})?)\s*(.*)$/);
  if (plusMatch) {
    const amount = parseAmount(plusMatch[1]);
    if (amount > 0) {
      return { type: 'entrada', amount, description: plusMatch[3].trim() || null };
    }
  }

  // -50 ou -30 lanche
  const minusMatch = trimmed.match(/^-\s*(\d+([.,]\d{1,2})?)\s*(.*)$/);
  if (minusMatch) {
    const amount = parseAmount(minusMatch[1]);
    if (amount > 0) {
      return { type: 'saida', amount, description: minusMatch[3].trim() || null };
    }
  }

  // entrada 100 ou entrada 100 salário
  const entradaMatch = trimmed.match(/^entrada\s+(\d+([.,]\d{1,2})?)\s*(.*)$/i);
  if (entradaMatch) {
    const amount = parseAmount(entradaMatch[1]);
    if (amount > 0) {
      return { type: 'entrada', amount, description: entradaMatch[3].trim() || null };
    }
  }

  // saída 50 ou saída 50 mercado
  const saidaMatch = trimmed.match(/^sa[ií]da\s+(\d+([.,]\d{1,2})?)\s*(.*)$/i);
  if (saidaMatch) {
    const amount = parseAmount(saidaMatch[1]);
    if (amount > 0) {
      return { type: 'saida', amount, description: saidaMatch[3].trim() || null };
    }
  }

  // 100 entrada ou 50 mercado (número primeiro: se tem palavra "entrada" -> entrada, senão saída com descrição)
  const numFirst = trimmed.match(/^(\d+([.,]\d{1,2})?)\s+(.+)$/);
  if (numFirst) {
    const amount = parseAmount(numFirst[1]);
    const rest = numFirst[3].trim().toLowerCase();
    if (amount > 0) {
      if (rest === 'entrada') {
        return { type: 'entrada', amount, description: null };
      }
      return { type: 'saida', amount, description: rest || null };
    }
  }

  return null;
}

function parseAmount(str) {
  const normalized = String(str).replace(',', '.');
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}
