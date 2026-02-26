import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT id, type, amount, description, category, source, created_at FROM transactions WHERE user_id = $1';
    const params = [req.user.id];
    let i = 2;
    if (type) {
      sql += ` AND type = $${i}`;
      params.push(type);
      i++;
    }
    if (startDate) {
      sql += ` AND created_at >= $${i}`;
      params.push(startDate);
      i++;
    }
    if (endDate) {
      sql += ` AND created_at <= $${i}`;
      params.push(endDate);
      i++;
    }
    sql += ' ORDER BY created_at DESC LIMIT $' + i + ' OFFSET $' + (i + 1);
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, amount, description, category } = req.body;
    if (!type || amount == null) {
      return res.status(400).json({ error: 'Tipo e valor são obrigatórios' });
    }
    if (type !== 'entrada' && type !== 'saida') {
      return res.status(400).json({ error: 'Tipo deve ser entrada ou saida' });
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }
    const result = await query(
      'INSERT INTO transactions (user_id, type, amount, description, category, source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, type, amount, description, category, source, created_at',
      [req.user.id, type, numAmount, description || null, category || null, 'manual']
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, type, amount, description, category, source, created_at FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transação não encontrada' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar transação' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { type, amount, description, category } = req.body;
    const result = await query(
      'UPDATE transactions SET type = COALESCE($2, type), amount = COALESCE($3, amount), description = COALESCE($4, description), category = COALESCE($5, category) WHERE id = $1 AND user_id = $6 RETURNING id, type, amount, description, category, source, created_at',
      [req.params.id, type || null, amount != null ? parseFloat(amount) : null, description !== undefined ? description : null, category !== undefined ? category : null, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transação não encontrada' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [
      req.params.id,
      req.user.id,
    ]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transação não encontrada' });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

export default router;
