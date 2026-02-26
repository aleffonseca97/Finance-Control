import { useState, useEffect } from 'react';
import client from '../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function formatMoney(n) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n);
}

function formatDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    Promise.all([
      client.get('/api/dashboard/summary', { params: { startDate: startStr, endDate: endStr } }),
      client.get('/api/dashboard/recent', { params: { limit: 15 } }),
      client.get('/api/dashboard/by-category', { params: { startDate: startStr, endDate: endStr } }),
    ])
      .then(([sumRes, recRes, catRes]) => {
        setSummary(sumRes.data);
        setRecent(recRes.data);
        setByCategory(catRes.data.slice(0, 8));
      })
      .catch((err) => setError(err.response?.data?.error || 'Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-loading">Carregando...</div>;
  }
  if (error) {
    return <div className="page-error">{error}</div>;
  }

  const chartData = byCategory.length
    ? byCategory.map((c) => ({ name: c.category || 'Outros', total: c.total }))
    : [{ name: 'Nenhum dado', total: 0 }];

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>

      <div className="cards-grid">
        <div className="card card-entrada">
          <span className="card-label">Entradas (mês)</span>
          <span className="card-value">{formatMoney(summary?.totalEntradas ?? 0)}</span>
        </div>
        <div className="card card-saida">
          <span className="card-label">Saídas (mês)</span>
          <span className="card-value">{formatMoney(summary?.totalSaidas ?? 0)}</span>
        </div>
        <div className="card card-saldo">
          <span className="card-label">Saldo (mês)</span>
          <span className="card-value">{formatMoney(summary?.saldo ?? 0)}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <h2>Últimas transações</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Descrição</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Nenhuma transação ainda.</td>
                  </tr>
                ) : (
                  recent.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className={`badge badge-${t.type}`}>{t.type === 'entrada' ? 'Entrada' : 'Saída'}</span>
                      </td>
                      <td className={t.type === 'entrada' ? 'positive' : 'negative'}>
                        {t.type === 'entrada' ? '+' : '-'} {formatMoney(t.amount)}
                      </td>
                      <td>{t.description || '-'}</td>
                      <td>{formatDate(t.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-section chart-section">
          <h2>Por categoria (mês)</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip formatter={(v) => [formatMoney(v), 'Total']} />
                <Bar dataKey="total" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
