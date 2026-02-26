import { useState, useEffect } from 'react';
import client from '../api/client';

export default function Integrations() {
  const [status, setStatus] = useState({ linked: false, linkedAt: null });
  const [code, setCode] = useState(null);
  const [codeExpires, setCodeExpires] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = () => {
    client
      .get('/api/telegram/status')
      .then((res) => setStatus({ linked: res.data.linked, linkedAt: res.data.linkedAt }))
      .catch(() => setStatus({ linked: false, linkedAt: null }));
  };

  useEffect(() => loadStatus(), []);

  const generateCode = () => {
    setError('');
    setLoading(true);
    setCode(null);
    client
      .get('/api/telegram/code')
      .then((res) => {
        setCode(res.data.code);
        setCodeExpires(res.data.expiresAt);
      })
      .catch((err) => setError(err.response?.data?.error || 'Erro ao gerar código'))
      .finally(() => setLoading(false));
  };

  const unlink = () => {
    if (!window.confirm('Desvincular sua conta do Telegram?')) return;
    setError('');
    client
      .delete('/api/telegram/unlink')
      .then(() => { setCode(null); loadStatus(); })
      .catch((err) => setError(err.response?.data?.error || 'Erro ao desvincular'));
  };

  const formatDate = (s) => (s ? new Date(s).toLocaleString('pt-BR') : '');

  return (
    <div className="integrations-page">
      <h1 className="page-title">Integrações</h1>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Telegram</h2>
      <p className="integrations-desc">
        Vincule sua conta ao Telegram para registrar entradas e saídas enviando mensagens ao bot.
        Use comandos como: <code>entrada 100</code>, <code>saída 50 mercado</code>, <code>+200</code>, <code>-30 lanche</code>.
      </p>

      {status.linked ? (
        <div className="status-card linked">
          <p><strong>Status:</strong> Vinculado</p>
          {status.linkedAt && <p>Vinculado em: {formatDate(status.linkedAt)}</p>}
          <button type="button" className="btn btn-danger" onClick={unlink}>Desvincular</button>
        </div>
      ) : (
        <div className="status-card">
          <p><strong>Status:</strong> Não vinculado</p>
          <ol className="integrations-steps">
            <li>Clique em &quot;Gerar código de vinculação&quot;.</li>
            <li>No Telegram, abra o bot e envie: <code>/vincular CODIGO</code> (substitua CODIGO pelo número de 6 dígitos).</li>
            <li>O código expira em 10 minutos.</li>
          </ol>
          <button
            type="button"
            className="btn btn-primary"
            onClick={generateCode}
            disabled={loading}
          >
            {loading ? 'Gerando...' : 'Gerar código de vinculação'}
          </button>
        </div>
      )}

      {code && (
        <div className="code-card">
          <p>Envie no Telegram:</p>
          <p className="code-value">/vincular {code}</p>
          <p className="code-expires">Expira em: {formatDate(codeExpires)}</p>
        </div>
      )}

      {error && <p className="page-error">{error}</p>}
    </div>
  );
}
