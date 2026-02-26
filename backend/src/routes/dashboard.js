import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    let i = 2;
    if (startDate) {
      whereClause += ` AND created_at >= $${i}`;
      params.push(startDate);
      i++;
    }
    if (endDate) {
      whereClause += ` AND created_at <= $${i}`;
      params.push(endDate);
      i++;
    }
    const [entradas, saidas] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(amount), 0)::numeric as total FROM transactions ${whereClause} AND type = 'entrada'`,
        params
      ),
      query(
        `SELECT COALESCE(SUM(amount), 0)::numeric as total FROM transactions ${whereClause} AND type = 'saida'`,
        params
      ),
    ]);
    const totalEntradas = parseFloat(entradas.rows[0]?.total || 0);
    const totalSaidas = parseFloat(saidas.rows[0]?.total || 0);
    return res.json({
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const result = await query(
      'SELECT id, type, amount, description, category, source, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [req.user.id, limit]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar transações recentes' });
  }
});

router.get('/by-category', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let sql = 'SELECT category, SUM(amount)::numeric as total FROM transactions WHERE user_id = $1 AND category IS NOT NULL AND category != \'\'';
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
    sql += ' GROUP BY category ORDER BY total DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map((r) => ({ category: r.category, total: parseFloat(r.total) })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar por categoria' });
  }
});

export default router;
