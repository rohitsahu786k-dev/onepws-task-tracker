import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { developerApi } from '../../api/apiKey.api';

const card = { background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 24 };

const MODULE_COLORS = {
  api_keys: { bg: 'rgba(102,126,234,0.15)', color: '#818cf8' },
  webhooks: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  external_api: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
};

export default function IntegrationLogs({ wid }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('');
  const [pagination, setPagination] = useState({ total: 0 });

  const load = useCallback(async () => {
    if (!wid) return;
    setLoading(true);
    try {
      const params = {};
      if (filterModule) params.module = filterModule;
      const res = await developerApi.getActivity(wid, params);
      setLogs(res.data || []);
      setPagination(res.pagination || {});
    } catch {
      toast.error('Failed to load integration logs');
    } finally {
      setLoading(false);
    }
  }, [wid, filterModule]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Integration Logs</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>{pagination.total || 0} events logged</p>
        </div>
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}
        >
          <option value="">All Modules</option>
          <option value="api_keys">API Keys</option>
          <option value="webhooks">Webhooks</option>
          <option value="external_api">External API</option>
        </select>
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>⏳ Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, margin: 0 }}>No activity logged yet</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => {
              const mc = MODULE_COLORS[log.module] || MODULE_COLORS.external_api;
              return (
                <div key={log._id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    <span style={{ ...mc, borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {log.module?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', fontSize: 13, margin: '0 0 4px', fontWeight: 500 }}>{log.description}</p>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ color: '#a78bfa', fontSize: 11, fontFamily: 'monospace' }}>{log.action}</span>
                      {log.performedBy?.name && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>by {log.performedBy.name}</span>
                      )}
                      {log.ipAddress && (
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}>{log.ipAddress}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
