import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { webhookApi, webhookDeliveryApi } from '../../api/apiKey.api';

const card = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  padding: 24,
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

const EVENT_GROUPS = {
  Tasks: ['task.created', 'task.updated', 'task.assigned', 'task.stage_changed', 'task.completed', 'task.overdue', 'task.commented'],
  Projects: ['project.created', 'project.updated', 'project.assigned', 'project.completed'],
  Approvals: ['approval.created', 'approval.approved', 'approval.rejected', 'approval.changes_requested', 'approval.completed'],
  Finance: ['budget.created', 'budget.approved', 'budget.rejected', 'budget.threshold_reached', 'expense.created', 'expense.approved', 'expense.rejected', 'expense.paid'],
  'Meetings & MOM': ['meeting.scheduled', 'meeting.updated', 'meeting.cancelled', 'mom.created', 'mom.signed', 'mom.action_point_created', 'mom.action_point_completed'],
  SLA: ['sla.breached', 'sla.deadline_approaching', 'sla.t0_confirmed'],
  Campaigns: ['campaign.created', 'campaign.started', 'campaign.completed', 'content.created', 'content.approved', 'content.scheduled', 'content.published'],
  Vendors: ['vendor.created', 'vendor.approved', 'vendor.rejected', 'vendor.blacklisted', 'vendor.contract_expiring'],
  'Print Jobs': ['print_job.created', 'print_job.artwork_approved', 'print_job.sent_to_vendor', 'print_job.proof_approved', 'print_job.dispatched', 'print_job.delivered', 'print_job.completed', 'print_job.reprint_required'],
  Timesheets: ['timesheet.submitted', 'timesheet.approved', 'timesheet.rejected'],
  Wiki: ['wiki.article_published', 'wiki.article_needs_update'],
  Employees: ['employee.created', 'employee.role_changed', 'employee.deactivated'],
};

function StatusBadge({ status }) {
  const colors = {
    active: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    disabled: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
    paused: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    failed: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  };
  const c = colors[status] || colors.disabled;
  return <span style={{ ...c, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{status?.toUpperCase()}</span>;
}

// ─── Webhook Create Form ───────────────────────────────────────────────────────
function CreateWebhookForm({ wid, onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: '', description: '', url: '', events: [],
    secret: '', timeoutSeconds: 10,
    retryPolicy: { enabled: true, maxRetries: 3, retryIntervalsMinutes: [1, 5, 15] },
  });
  const [loading, setLoading] = useState(false);

  const toggleEvent = (evt) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(evt) ? f.events.filter((e) => e !== evt) : [...f.events, evt],
    }));
  };

  const toggleGroup = (groupEvents) => {
    const allSelected = groupEvents.every((e) => form.events.includes(e));
    if (allSelected) {
      setForm((f) => ({ ...f, events: f.events.filter((e) => !groupEvents.includes(e)) }));
    } else {
      setForm((f) => ({ ...f, events: [...new Set([...f.events, ...groupEvents])] }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.url) return toast.error('Webhook URL is required');
    if (form.events.length === 0) return toast.error('Select at least one event');
    setLoading(true);
    try {
      const res = await webhookApi.create(wid, form);
      toast.success('Webhook created!');
      onCreated(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create webhook');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 };

  return (
    <form onSubmit={submit} style={{ ...card }}>
      <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Create Webhook</h3>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label style={labelStyle}>Name *</label>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. CRM Task Sync" required />
        </div>
        <div>
          <label style={labelStyle}>Timeout (seconds)</label>
          <input type="number" style={inputStyle} value={form.timeoutSeconds} onChange={(e) => setForm({ ...form, timeoutSeconds: Number(e.target.value) })} min={5} max={30} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Webhook URL (HTTPS) *</label>
          <input style={inputStyle} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://crm.example.com/webhooks/onepws" required />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Description</label>
          <input style={inputStyle} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this webhook do?" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Secret (leave blank to auto-generate)</label>
          <input style={inputStyle} value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="Custom webhook secret..." />
        </div>
      </div>

      {/* Event Selector */}
      <div style={{ marginTop: 20 }}>
        <label style={labelStyle}>
          Subscribe to Events *
          <span style={{ color: '#a78bfa', marginLeft: 8, fontWeight: 700 }}>{form.events.length} selected</span>
        </label>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {Object.entries(EVENT_GROUPS).map(([group, evts]) => {
            const allSelected = evts.every((e) => form.events.includes(e));
            return (
              <div key={group} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>{group}</p>
                  <button type="button" onClick={() => toggleGroup(evts)} style={{ ...btnGhost, fontSize: 10, padding: '3px 8px' }}>
                    {allSelected ? 'None' : 'All'}
                  </button>
                </div>
                {evts.map((evt) => (
                  <label key={evt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '3px 0' }}>
                    <input type="checkbox" checked={form.events.includes(evt)} onChange={() => toggleEvent(evt)} style={{ cursor: 'pointer' }} />
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: 'monospace' }}>{evt}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button type="submit" disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Creating...' : '🔗 Create Webhook'}
        </button>
        <button type="button" onClick={onCancel} style={btnGhost}>Cancel</button>
      </div>
    </form>
  );
}

// ─── Webhook Row ───────────────────────────────────────────────────────────────
function WebhookRow({ webhook, wid, onRefresh }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await webhookApi.test(wid, webhook._id);
      setTestResult({ ok: true, status: res.data?.responseStatus, time: res.data?.responseTimeMs });
      toast.success('Test webhook sent!');
    } catch (err) {
      setTestResult({ ok: false, error: err?.response?.data?.error || 'Failed' });
      toast.error('Webhook test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleToggle = async () => {
    try {
      if (webhook.status === 'active') {
        await webhookApi.disable(wid, webhook._id);
        toast.success('Webhook disabled');
      } else {
        await webhookApi.enable(wid, webhook._id);
        toast.success('Webhook enabled');
      }
      onRefresh();
    } catch {
      toast.error('Failed to update webhook status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this webhook?')) return;
    try {
      await webhookApi.remove(wid, webhook._id);
      toast.success('Webhook deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete webhook');
    }
  };

  const domain = (() => { try { return new URL(webhook.url).hostname; } catch { return webhook.url; } })();

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🔗</span>
            <div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{webhook.name}</span>
              <span style={{ marginLeft: 10 }}><StatusBadge status={webhook.status} /></span>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 10px' }}>{webhook.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: 'rgba(102,126,234,0.15)', color: '#a78bfa', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'monospace' }}>{domain}</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{webhook.events?.length || 0} events</span>
            <span style={{ color: '#10b981', fontSize: 12 }}>✓ {webhook.successCount || 0}</span>
            <span style={{ color: '#ef4444', fontSize: 12 }}>✗ {webhook.failureCount || 0}</span>
            {webhook.lastSuccessAt && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Last ✓: {new Date(webhook.lastSuccessAt).toLocaleString()}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <button onClick={handleTest} disabled={testing} style={{ ...btnGhost, fontSize: 11 }}>
            {testing ? '⏳' : '🧪'} Test
          </button>
          <button onClick={handleToggle} style={{ ...btnGhost, fontSize: 11, color: webhook.status === 'active' ? '#f59e0b' : '#10b981', borderColor: webhook.status === 'active' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)' }}>
            {webhook.status === 'active' ? 'Disable' : 'Enable'}
          </button>
          <button onClick={handleDelete} style={{ ...btnGhost, fontSize: 11, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
            Delete
          </button>
        </div>
      </div>

      {testResult && (
        <div style={{ marginTop: 12, background: testResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${testResult.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
          {testResult.ok
            ? <span style={{ color: '#10b981' }}>✓ Test delivered! HTTP {testResult.status} in {testResult.time}ms</span>
            : <span style={{ color: '#ef4444' }}>✗ Test failed: {testResult.error}</span>}
        </div>
      )}

      {/* Events preview */}
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(webhook.events || []).slice(0, 8).map((e) => (
          <span key={e} style={{ background: 'rgba(102,126,234,0.1)', color: '#a78bfa', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontFamily: 'monospace' }}>{e}</span>
        ))}
        {(webhook.events?.length || 0) > 8 && (
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>+{webhook.events.length - 8} more</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Webhooks({ wid }) {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    if (!wid) return;
    setLoading(true);
    try {
      const res = await webhookApi.list(wid);
      setWebhooks(res.data || res.webhooks || []);
    } catch {
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }, [wid]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Webhooks</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>
            {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={btn}>
          {showCreate ? '✕ Cancel' : '+ Create Webhook'}
        </button>
      </div>

      {showCreate && (
        <div style={{ marginBottom: 24 }}>
          <CreateWebhookForm wid={wid} onCreated={() => { setShowCreate(false); load(); }} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {loading ? (
        <div style={{ ...card, textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.4)' }}>⏳ Loading webhooks...</div>
      ) : webhooks.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, margin: 0 }}>No webhooks configured yet</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 8 }}>Create webhooks to push real-time events to external systems</p>
          <button onClick={() => setShowCreate(true)} style={{ ...btn, marginTop: 20 }}>+ Create Webhook</button>
        </div>
      ) : (
        <div>
          {webhooks.map((w) => (
            <WebhookRow key={w._id} webhook={w} wid={wid} onRefresh={load} />
          ))}
        </div>
      )}

      {/* Signature guide */}
      <div style={{ ...card, marginTop: 24 }}>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Webhook Signature Verification</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 16 }}>
          Every webhook payload is signed with HMAC-SHA256. Verify signatures to ensure requests come from ONEPWS.
        </p>
        <pre style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '16px 20px', color: '#a78bfa', fontSize: 12, fontFamily: 'monospace', overflowX: 'auto', margin: 0 }}>
{`// Verify ONEPWS webhook signature (Node.js)
function verifyOnePWSWebhook(req, secret) {
  const timestamp = req.headers['x-onepws-timestamp'];
  const signature = req.headers['x-onepws-signature'];
  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${JSON.stringify(req.body)}\`)
    .digest('hex');
  return signature === \`sha256=\${expected}\`;
}`}
        </pre>
      </div>
    </div>
  );
}
