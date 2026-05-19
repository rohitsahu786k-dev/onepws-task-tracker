import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { webhookDeliveryApi } from '../../api/apiKey.api';

const card = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  padding: 0,
  overflow: 'hidden',
};

const btn = {
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: '#fff', border: 'none', borderRadius: 10,
  padding: '10px 20px', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
};

const btnGhost = {
  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
  padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
};

const STATUS_COLORS = {
  success: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  failed: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  retry_scheduled: { bg: 'rgba(102,126,234,0.15)', color: '#818cf8' },
  retrying: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  cancelled: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
};

function DeliveryRow({ delivery, wid, onRetry }) {
  const [expanded, setExpanded] = useState(false);
  const c = STATUS_COLORS[delivery.status] || STATUS_COLORS.cancelled;

  return (
    <>
      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
          {delivery._id?.slice(-8)}
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{ background: 'rgba(102,126,234,0.12)', color: '#a78bfa', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'monospace' }}>
            {delivery.event}
          </span>
        </td>
        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
          {delivery.webhook?.name || '—'}
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{ ...c, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
            {delivery.status?.replace(/_/g, ' ').toUpperCase()}
          </span>
        </td>
        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
          {delivery.attempt} / {delivery.maxAttempts}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {delivery.responseStatus && (
            <span style={{ color: delivery.responseStatus < 300 ? '#10b981' : '#ef4444', fontSize: 13, fontWeight: 700 }}>
              {delivery.responseStatus}
            </span>
          )}
        </td>
        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
          {delivery.responseTimeMs ? `${delivery.responseTimeMs}ms` : '—'}
        </td>
        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          {new Date(delivery.createdAt).toLocaleString()}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {(delivery.status === 'failed' || delivery.status === 'cancelled') && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(delivery._id); }}
              style={{ ...btnGhost, fontSize: 11, color: '#a78bfa', borderColor: 'rgba(102,126,234,0.3)' }}
            >
              🔄 Retry
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
          <td colSpan={9} style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {delivery.errorMessage && (
                <div style={{ gridColumn: '1/-1' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase' }}>Error</p>
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 12, fontFamily: 'monospace' }}>
                    {delivery.errorMessage}
                  </div>
                </div>
              )}
              {delivery.responseBody && (
                <div style={{ gridColumn: '1/-1' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase' }}>Response Body</p>
                  <pre style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '10px 14px', color: '#a78bfa', fontSize: 11, fontFamily: 'monospace', maxHeight: 200, overflowY: 'auto', margin: 0 }}>
                    {delivery.responseBody}
                  </pre>
                </div>
              )}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase' }}>Event ID</p>
                <code style={{ color: '#a78bfa', fontSize: 12, fontFamily: 'monospace' }}>{delivery.eventId}</code>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase' }}>URL</p>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, wordBreak: 'break-all' }}>{delivery.url}</span>
              </div>
              {delivery.nextRetryAt && (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase' }}>Next Retry</p>
                  <span style={{ color: '#f59e0b', fontSize: 12 }}>{new Date(delivery.nextRetryAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function WebhookDeliveries({ wid }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ total: 0 });

  const load = useCallback(async () => {
    if (!wid) return;
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await webhookDeliveryApi.list(wid, params);
      setDeliveries(res.data || []);
      setPagination(res.pagination || {});
    } catch {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, [wid, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (deliveryId) => {
    try {
      await webhookDeliveryApi.retry(wid, deliveryId);
      toast.success('Retry initiated');
      load();
    } catch {
      toast.error('Failed to retry delivery');
    }
  };

  const handleRetryAll = async () => {
    try {
      const res = await webhookDeliveryApi.retryFailed(wid, {});
      toast.success(res.message || 'Retry queued for all failed deliveries');
      load();
    } catch {
      toast.error('Failed to retry all');
    }
  };

  const thStyle = { padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Webhook Deliveries</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>
            {pagination.total || 0} total deliveries
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="retry_scheduled">Retry Scheduled</option>
            <option value="retrying">Retrying</option>
          </select>
          <button onClick={handleRetryAll} style={btn}>🔄 Retry All Failed</button>
        </div>
      </div>

      <div style={card}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>⏳ Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, margin: 0 }}>No deliveries found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Event</th>
                  <th style={thStyle}>Webhook</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Attempt</th>
                  <th style={thStyle}>HTTP</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <DeliveryRow key={d._id} delivery={d} wid={wid} onRetry={handleRetry} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
