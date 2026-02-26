import TelegramBot from 'node-telegram-bot-api';
import { query } from '../db.js';
import { parseMessage } from './parser.js';

let bot = null;

export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return Promise.resolve();

  bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/vincular\s+(\d{6})/, async (msg, match) => {
    const chatId = msg.chat.id;
    const code = match[1];
    try {
      const codeResult = await query(
        "SELECT user_id FROM linking_codes WHERE code = $1 AND expires_at > datetime('now')",
        [code]
      );
      if (codeResult.rows.length === 0) {
        await bot.sendMessage(chatId, 'Código inválido ou expirado. Gere um novo no app.');
        return;
      }
      const userId = codeResult.rows[0].user_id;
      await query('DELETE FROM linking_codes WHERE code = $1', [code]);
      await query(
        "INSERT INTO telegram_links (user_id, telegram_chat_id) VALUES ($1, $2) ON CONFLICT (telegram_chat_id) DO UPDATE SET user_id = excluded.user_id, linked_at = datetime('now')",
        [userId, String(chatId)]
      );
      await bot.sendMessage(chatId, 'Conta vinculada com sucesso! Agora você pode enviar entradas e saídas aqui.');
    } catch (err) {
      console.error('Erro ao vincular:', err);
      await bot.sendMessage(chatId, 'Erro ao vincular. Tente novamente.');
    }
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    const parsed = parseMessage(text);
    if (!parsed) {
      await bot.sendMessage(
        chatId,
        'Formato não reconhecido. Use por exemplo:\n• entrada 100\n• saída 50 mercado\n• +200\n• -30 lanche'
      );
      return;
    }

    try {
      const linkResult = await query('SELECT user_id FROM telegram_links WHERE telegram_chat_id = $1', [
        String(chatId),
      ]);
      if (linkResult.rows.length === 0) {
        await bot.sendMessage(
          chatId,
          'Envie /vincular CODIGO para vincular sua conta. Gere o código no app em Integrações.'
        );
        return;
      }
      const userId = linkResult.rows[0].user_id;
      await query(
        'INSERT INTO transactions (user_id, type, amount, description, source) VALUES ($1, $2, $3, $4, $5)',
        [userId, parsed.type, parsed.amount, parsed.description, 'telegram']
      );
      const label = parsed.type === 'entrada' ? 'Entrada' : 'Saída';
      const desc = parsed.description ? ` (${parsed.description})` : '';
      await bot.sendMessage(chatId, `${label} de R$ ${parsed.amount.toFixed(2)}${desc} registrada.`);
    } catch (err) {
      console.error('Erro ao registrar transação via Telegram:', err);
      await bot.sendMessage(chatId, 'Erro ao registrar. Tente novamente.');
    }
  });

  return Promise.resolve();
}
