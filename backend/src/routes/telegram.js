import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();
router.use(authMiddleware);

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

router.get('/status', async (req, res) => {
  try {
    const result = await query(
      'SELECT telegram_chat_id, linked_at FROM telegram_links WHERE user_id = $1',
      [req.user.id]
    );
    const linked = result.rows.length > 0;
    return res.json({
      linked,
      linkedAt: linked ? result.rows[0].linked_at : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

router.get('/code', async (req, res) => {
  try {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await query(
      'INSERT INTO linking_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
      [req.user.id, code, expiresAt]
    );
    return res.json({ code, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao gerar código' });
  }
});

router.delete('/unlink', async (req, res) => {
  try {
    await query('DELETE FROM telegram_links WHERE user_id = $1', [req.user.id]);
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao desvincular' });
  }
});

export default router;
export { generateCode };
