import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { apiKeyApi } from '../../api/apiKey.api';

// ─── Styles ──────────────────────────────────────────────────────────────────
const card = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  padding: 24,
};

const btn = {
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '10px 20px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 0.2s',
};

const btnGhost = {
  background: 'rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const PERMISSIONS_GROUPS = {
  Tasks: ['tasks:read', 'tasks:create', 'tasks:update', 'tasks:comment'],
  Projects: ['projects:read', 'projects:create', 'projects:update'],
  Tracker: ['tracker:read', 'tracker:create', 'tracker:update'],
  Calendar: ['calendar:read', 'calendar:create'],
  Media: ['media:read', 'media:upload'],
  Meetings: ['meetings:read', 'meetings:create'],
  MOM: ['mom:read', 'mom:create'],
  Approvals: ['approvals:read'],
  Finance: ['budget:read', 'expenses:read', 'expenses:create'],
  Campaigns: ['campaigns:read', 'campaigns:create', 'campaigns:update'],
  Content: ['content:read', 'content:create', 'content:update'],
  Vendors: ['vendors:read', 'vendors:create', 'vendors:update'],
  'Print Jobs': ['print_jobs:read', 'print_jobs:create', 'print_jobs:update'],
  Employees: ['employees:read'],
  Wiki: ['wiki:read', 'wiki:create'],
  Reports: ['reports:read'],
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    active: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', dot: '#10b981' },
    revoked: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', dot: '#ef4444' },
    expired: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', dot: '#f59e0b' },
    disabled: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', dot: '#94a3b8' },
  };
  const c = colors[status] || colors.disabled;
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {status?.toUpperCase()}
    </span>
  );
}

// ─── Created Key Modal ────────────────────────────────────────────────────────
function APIKeyCreatedModal({ rawKey, keyPrefix, onClose }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    toast.success('API key copied!');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1e1b4b', border: '1px solid rgba(102,126,234,0.3)', borderRadius: 20, maxWidth: 560, width: '100%', padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>API Key Created!</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8 }}>
            This key will never be shown again. Copy it now and store it safely.
          </p>
        </div>

        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ color: '#fca5a5', fontSize: 13 }}>Copy this key now. For security reasons, it will not be visible again.</span>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Your API Key</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <code style={{ color: '#a78bfa', fontSize: 13, fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>{rawKey}</code>
            <button onClick={copy} style={{ ...btnGhost, background: copied ? 'rgba(16,185,129,0.2)' : undefined, color: copied ? '#10b981' : undefined, flexShrink: 0 }}>
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 24 }}>
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>I have copied and saved my API key</span>
        </label>

        <button
          onClick={onClose}
          disabled={!confirmed}
          style={{ ...btn, width: '100%', justifyContent: 'center', opacity: confirmed ? 1 : 0.4, cursor: confirmed ? 'pointer' : 'not-allowed' }}
        >
          Done — Close
        </button>
      </div>
    </div>
  );
}

// ─── Create API Key Form ───────────────────────────────────────────────────────
function CreateAPIKeyForm({ wid, onCreated, onCancel }) {
  const [form, setForm] = useState({ name: '', description: '', environment: 'live', permissions: [], allowedIps: '', expiresAt: '' });
  const [loading, setLoading] = useState(false);

  const togglePermission = (perm) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter((p) => p !== perm) : [...f.permissions, perm],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        allowedIps: form.allowedIps ? form.allowedIps.split(',').map((s) => s.trim()).filter(Boolean) : [],
        expiresAt: form.expiresAt || undefined,
      };
      const res = await apiKeyApi.create(wid, payload);
      onCreated(res.data?.apiKey || res.apiKey);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 };

  return (
    <form onSubmit={submit} style={{ ...card }}>
      <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Create API Key</h3>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label style={labelStyle}>Name *</label>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Website Integration" required />
        </div>
        <div>
          <label style={labelStyle}>Environment</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
            <option value="live">🟢 Live</option>
            <option value="test">🧪 Test</option>
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Description</label>
          <input style={inputStyle} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this key used for?" />
        </div>
        <div>
          <label style={labelStyle}>Allowed IPs (comma separated)</label>
          <input style={inputStyle} value={form.allowedIps} onChange={(e) => setForm({ ...form, allowedIps: e.target.value })} placeholder="203.0.113.10, 203.0.113.20" />
        </div>
        <div>
          <label style={labelStyle}>Expires At (optional)</label>
          <input type="date" style={{ ...inputStyle, colorScheme: 'dark' }} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={labelStyle}>Permissions</label>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))' }}>
          {Object.entries(PERMISSIONS_GROUPS).map(([group, perms]) => (
            <div key={group} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 14 }}>
              <p style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{group}</p>
              {perms.map((perm) => (
                <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
                  <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePermission(perm)} style={{ cursor: 'pointer' }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'monospace' }}>{perm}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button type="submit" disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Creating...' : '🔑 Create API Key'}
        </button>
        <button type="button" onClick={onCancel} style={{ ...btnGhost }}>Cancel</button>
      </div>
    </form>
  );
}

// ─── API Keys Table ───────────────────────────────────────────────────────────
function APIKeyRow({ apiKey, onRevoke, onDisable }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <td style={{ padding: '14px 16px' }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{apiKey.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace' }}>{apiKey.keyPrefix}...</div>
        </td>
        <td style={{ padding: '14px 16px' }}>
          <span style={{ background: apiKey.environment === 'live' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: apiKey.environment === 'live' ? '#10b981' : '#f59e0b', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
            {apiKey.environment?.toUpperCase()}
          </span>
        </td>
        <td style={{ padding: '14px 16px' }}><StatusBadge status={apiKey.status} /></td>
        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{apiKey.permissions?.length || 0} permissions</td>
        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
          {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Never'}
        </td>
        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
          {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : 'No expiry'}
        </td>
        <td style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setExpanded(!expanded)} style={{ ...btnGhost, fontSize: 11 }}>
              {expanded ? '▲' : '▼'} Details
            </button>
            {apiKey.status === 'active' && (
              <>
                <button onClick={() => onDisable(apiKey._id)} style={{ ...btnGhost, color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', fontSize: 11 }}>
                  Disable
                </button>
                <button onClick={() => onRevoke(apiKey._id)} style={{ ...btnGhost, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: 11 }}>
                  Revoke
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
          <td colSpan={7} style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase' }}>Permissions</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {apiKey.permissions?.length > 0 ? apiKey.permissions.map((p) => (
                    <span key={p} style={{ background: 'rgba(102,126,234,0.15)', color: '#a78bfa', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'monospace' }}>{p}</span>
                  )) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No permissions</span>}
                </div>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase' }}>Allowed IPs</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {apiKey.allowedIps?.length > 0 ? apiKey.allowedIps.map((ip) => (
                    <span key={ip} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'monospace' }}>{ip}</span>
                  )) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>All IPs allowed</span>}
                </div>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase' }}>Usage Count</p>
                <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{apiKey.usageCount || 0}</span>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase' }}>Created By</p>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{apiKey.createdBy?.name || '—'}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function APIKeys({ wid }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState(null);

  const load = useCallback(async () => {
    if (!wid) return;
    setLoading(true);
    try {
      const res = await apiKeyApi.list(wid);
      setKeys(res.data || res.apiKeys || []);
    } catch (err) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [wid]);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (rawKey) => {
    setShowCreate(false);
    setCreatedKey(rawKey);
    load();
  };

  const handleRevoke = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    try {
      await apiKeyApi.revoke(wid, keyId, { reason: 'Revoked by admin' });
      toast.success('API key revoked');
      load();
    } catch (err) {
      toast.error('Failed to revoke API key');
    }
  };

  const handleDisable = async (keyId) => {
    try {
      await apiKeyApi.disable(wid, keyId);
      toast.success('API key disabled');
      load();
    } catch (err) {
      toast.error('Failed to disable API key');
    }
  };

  const thStyle = { padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div>
      {createdKey && <APIKeyCreatedModal rawKey={createdKey} onClose={() => setCreatedKey(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>API Keys</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>
            {keys.length} key{keys.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={btn}>
          {showCreate ? '✕ Cancel' : '+ Create API Key'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div style={{ marginBottom: 24 }}>
          <CreateAPIKeyForm wid={wid} onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {/* Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>⏳ Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, margin: 0 }}>No API keys created yet</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 8 }}>Create your first API key to start integrating external systems</p>
            <button onClick={() => setShowCreate(true)} style={{ ...btn, marginTop: 20 }}>+ Create API Key</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name / Prefix</th>
                  <th style={thStyle}>Environment</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Permissions</th>
                  <th style={thStyle}>Last Used</th>
                  <th style={thStyle}>Expires</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <APIKeyRow key={k._id} apiKey={k} onRevoke={handleRevoke} onDisable={handleDisable} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auth Guide */}
      <div style={{ ...card, marginTop: 24 }}>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Using API Keys</h3>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase' }}>Authorization Header</p>
            <pre style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '12px 16px', color: '#a78bfa', fontSize: 12, fontFamily: 'monospace', margin: 0 }}>{`Authorization: Bearer opws_live_xxxxx`}</pre>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase' }}>Alternative Header</p>
            <pre style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '12px 16px', color: '#a78bfa', fontSize: 12, fontFamily: 'monospace', margin: 0 }}>{`X-API-Key: opws_live_xxxxx`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
