import { useState, useEffect } from 'react';
import client from '../api/client';

function formatMoney(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}
function formatDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function Transactions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ type: 'entrada', amount: '', description: '', category: '' });
  const [filterType, setFilterType] = useState('');

  const load = () => {
    setLoading(true);
    const params = filterType ? { type: filterType } : {};
    client
      .get('/api/transactions', { params })
      .then((res) => setList(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Erro ao carregar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [filterType]);

  const resetForm = () => {
    setForm({ type: 'entrada', amount: '', description: '', category: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Valor inválido');
      return;
    }
    if (editingId) {
      client
        .put(`/api/transactions/${editingId}`, { ...form, amount })
        .then(() => { resetForm(); load(); })
        .catch((err) => setError(err.response?.data?.error || 'Erro ao atualizar'));
    } else {
      client
        .post('/api/transactions', { ...form, amount })
        .then(() => { resetForm(); load(); })
        .catch((err) => setError(err.response?.data?.error || 'Erro ao criar'));
    }
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setForm({
      type: t.type,
      amount: String(t.amount),
      description: t.description || '',
      category: t.category || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Excluir esta transação?')) return;
    client
      .delete(`/api/transactions/${id}`)
      .then(() => load())
      .catch((err) => setError(err.response?.data?.error || 'Erro ao excluir'));
  };

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1 className="page-title">Transações</h1>
        <button type="button" className="btn btn-primary" onClick={() => { setError(''); setShowForm(true); resetForm(); }}>
          Nova transação
        </button>
      </div>
      {error && <p className="page-error">{error}</p>}

      <div className="filters">
        <label>
          <span>Tipo:</span>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </label>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>{editingId ? 'Editar transação' : 'Nova transação'}</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Tipo
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </label>
            <label>
              Valor
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </label>
            <label>
              Descrição
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Opcional"
              />
            </label>
            <label>
              Categoria
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Opcional"
              />
            </label>
            <div className="form-actions">
              <button type="submit">{editingId ? 'Salvar' : 'Criar'}</button>
              <button type="button" onClick={resetForm}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrap">
        {loading ? (
          <p className="page-loading">Carregando...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6}>Nenhuma transação.</td>
                </tr>
              ) : (
                list.map((t) => (
                  <tr key={t.id}>
                    <td><span className={`badge badge-${t.type}`}>{t.type === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                    <td className={t.type === 'entrada' ? 'positive' : 'negative'}>
                      {t.type === 'entrada' ? '+' : '-'} {formatMoney(t.amount)}
                    </td>
                    <td>{t.description || '-'}</td>
                    <td>{t.category || '-'}</td>
                    <td>{formatDate(t.created_at)}</td>
                    <td>
                      <button type="button" className="btn-sm" onClick={() => handleEdit(t)}>Editar</button>
                      <button type="button" className="btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Excluir</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
