import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { developerApi } from '../../api/apiKey.api';

const card = { background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 24 };

const EVENT_GROUPS = {
  Tasks: { icon: '✅', events: ['task.created', 'task.updated', 'task.assigned', 'task.stage_changed', 'task.completed', 'task.overdue', 'task.commented'] },
  Projects: { icon: '📁', events: ['project.created', 'project.updated', 'project.assigned', 'project.completed'] },
  Approvals: { icon: '✔️', events: ['approval.created', 'approval.approved', 'approval.rejected', 'approval.changes_requested', 'approval.completed'] },
  Finance: { icon: '💰', events: ['budget.created', 'budget.approved', 'budget.rejected', 'budget.threshold_reached', 'expense.created', 'expense.approved', 'expense.rejected', 'expense.paid'] },
  'Meetings & MOM': { icon: '📅', events: ['meeting.scheduled', 'meeting.updated', 'meeting.cancelled', 'mom.created', 'mom.signed', 'mom.action_point_created', 'mom.action_point_completed'] },
  SLA: { icon: '⏱️', events: ['sla.breached', 'sla.deadline_approaching', 'sla.t0_confirmed'] },
  Campaigns: { icon: '📣', events: ['campaign.created', 'campaign.started', 'campaign.completed', 'content.created', 'content.approved', 'content.scheduled', 'content.published'] },
  Vendors: { icon: '🏢', events: ['vendor.created', 'vendor.approved', 'vendor.rejected', 'vendor.blacklisted', 'vendor.contract_expiring'] },
  'Print Jobs': { icon: '🖨️', events: ['print_job.created', 'print_job.artwork_approved', 'print_job.sent_to_vendor', 'print_job.proof_approved', 'print_job.dispatched', 'print_job.delivered', 'print_job.completed', 'print_job.reprint_required'] },
  Timesheets: { icon: '⏰', events: ['timesheet.submitted', 'timesheet.approved', 'timesheet.rejected'] },
  Wiki: { icon: '📚', events: ['wiki.article_published', 'wiki.article_needs_update'] },
  Employees: { icon: '👤', events: ['employee.created', 'employee.role_changed', 'employee.deactivated'] },
};

const SAMPLE_PAYLOADS = {
  'task.created': {
    id: 'evt_1716134400_abc123',
    event: 'task.created',
    workspaceId: 'WS_ID',
    timestamp: '2026-05-19T10:00:00.000Z',
    data: { id: 'TASK_ID', taskNumber: 'MKT-2026-0001', title: 'Brochure Design', status: 'open', assignedTo: 'USER_ID' },
    metadata: { source: 'onepws', environment: 'live' },
  },
  'webhook.test': {
    id: 'evt_test_123',
    event: 'webhook.test',
    workspaceId: 'WS_ID',
    timestamp: '2026-05-19T10:00:00.000Z',
    data: { message: 'This is a test webhook from ONEPWS.' },
    metadata: { source: 'onepws', test: true },
  },
};

export default function EventCatalog({ wid }) {
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [catalog, setCatalog] = useState(null);

  const load = useCallback(async () => {
    if (!wid) return;
    try {
      const res = await developerApi.getEventCatalog(wid);
      setCatalog(res.data);
    } catch (err) {
      // fallback to local data
    }
  }, [wid]);

  useEffect(() => { load(); }, [load]);

  const totalEvents = Object.values(EVENT_GROUPS).reduce((sum, g) => sum + g.events.length, 0);

  const filtered = search
    ? Object.fromEntries(
        Object.entries(EVENT_GROUPS).map(([k, v]) => [k, { ...v, events: v.events.filter((e) => e.includes(search.toLowerCase())) }]).filter(([, v]) => v.events.length > 0)
      )
    : EVENT_GROUPS;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Event Catalog</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>
            {totalEvents} events across {Object.keys(EVENT_GROUPS).length} modules
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search events..."
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 10, padding: '10px 16px', fontSize: 13, outline: 'none', width: 240 }}
        />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {Object.entries(filtered).map(([group, { icon, events }]) => (
          <div key={group} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div>
                <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: 0 }}>{group}</h3>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{events.length} events</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {events.map((evt) => (
                <button
                  key={evt}
                  onClick={() => setSelectedEvent(selectedEvent === evt ? null : evt)}
                  style={{
                    background: selectedEvent === evt ? 'rgba(102,126,234,0.2)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${selectedEvent === evt ? 'rgba(102,126,234,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <code style={{ color: '#a78bfa', fontSize: 12, fontFamily: 'monospace', textAlign: 'left' }}>{evt}</code>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{selectedEvent === evt ? '▲' : '▼'}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sample payload panel */}
      {selectedEvent && (
        <div style={{ ...card, marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>Sample Payload</h3>
            <code style={{ background: 'rgba(102,126,234,0.15)', color: '#a78bfa', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontFamily: 'monospace' }}>{selectedEvent}</code>
          </div>
          <pre style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '16px 20px', color: '#a78bfa', fontSize: 12, fontFamily: 'monospace', overflowX: 'auto', margin: 0 }}>
            {JSON.stringify(SAMPLE_PAYLOADS[selectedEvent] || {
              id: `evt_${Date.now()}_xxxxx`,
              event: selectedEvent,
              workspaceId: 'WS_ID',
              timestamp: new Date().toISOString(),
              data: { id: 'RESOURCE_ID', message: `${selectedEvent} event data` },
              metadata: { source: 'onepws', environment: 'live' },
            }, null, 2)}
          </pre>
        </div>
      )}

      {/* Webhook Headers Reference */}
      <div style={{ ...card, marginTop: 24 }}>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Webhook Request Headers</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { header: 'X-OnePWS-Event', desc: 'The event name that triggered this delivery', example: 'task.created' },
            { header: 'X-OnePWS-Delivery', desc: 'Unique delivery ID for deduplication', example: 'DELIVERY_ID' },
            { header: 'X-OnePWS-Timestamp', desc: 'Unix timestamp of delivery (for signature)', example: '1716134400' },
            { header: 'X-OnePWS-Signature', desc: 'HMAC-SHA256 signature for payload verification', example: 'sha256=abcdef...' },
          ].map(({ header, desc, example }) => (
            <div key={header} style={{ display: 'flex', gap: 16, padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, alignItems: 'flex-start' }}>
              <code style={{ color: '#a78bfa', fontSize: 12, fontFamily: 'monospace', flexShrink: 0, minWidth: 240 }}>{header}</code>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '0 0 4px' }}>{desc}</p>
                <code style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }}>Example: {example}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
