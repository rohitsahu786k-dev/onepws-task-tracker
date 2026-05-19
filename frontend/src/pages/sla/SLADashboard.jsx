import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';

const STATUS_COLORS = {
  on_track: { bg: '#dcfce7', color: '#16a34a' },
  at_risk: { bg: '#fef3c7', color: '#d97706' },
  breached: { bg: '#fef2f2', color: '#dc2626' },
  completed: { bg: '#d1fae5', color: '#059669' },
  delayed: { bg: '#fef2f2', color: '#dc2626' },
  not_started: { bg: '#f1f5f9', color: '#64748b' },
  in_progress: { bg: '#dbeafe', color: '#2563eb' },
};

const StatCard = ({ label, value, color = '#2563eb', icon }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
    <div>
      <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</p>
      <p style={{ color: '#0f172a', fontSize: 26, fontWeight: 800, margin: '4px 0 0' }}>{value ?? '—'}</p>
    </div>
  </div>
);

const SLADashboard = () => {
  const { workspace, user } = useAuthStore();
  const wid = workspace?._id || workspace?.id || user?.defaultWorkspace?._id || user?.defaultWorkspace;
  const [filterStatus, setFilterStatus] = useState('');

  const { data: dashData } = useQuery({
    queryKey: ['sla-dashboard', wid],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${wid}/sla/dashboard`);
      return data?.data;
    },
    enabled: !!wid,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['sla-trackers', wid, filterStatus],
    queryFn: async () => {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const { data } = await api.get(`/workspaces/${wid}/sla${params}`);
      return data;
    },
    enabled: !!wid,
  });

  const trackers = data?.data || data?.trackers || [];

  if (!wid) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>Select a workspace first</h1>
    </div>
  );

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>SLA Center</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Service Level Agreement tracking and compliance</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
            <option value="">All Status</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <Link to="/settings/sla" style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            ⚙️ SLA Config
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total SLA Tasks" value={dashData?.total || trackers.length} color="#2563eb" icon="📊" />
        <StatCard label="On Track" value={dashData?.onTrack || trackers.filter(t => t.overallStatus === 'on_track').length} color="#16a34a" icon="✅" />
        <StatCard label="At Risk" value={dashData?.atRisk || trackers.filter(t => t.overallStatus === 'at_risk').length} color="#d97706" icon="⚠️" />
        <StatCard label="Breached" value={dashData?.breached || trackers.filter(t => t.overallStatus === 'breached').length} color="#dc2626" icon="🔴" />
        <StatCard label="Compliance %" value={dashData?.slaComplianceRate ? `${dashData.slaComplianceRate}%` : '—'} color="#7c3aed" icon="📈" />
      </div>

      {/* Trackers Table */}
      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading SLA trackers...</div>
      ) : trackers.length === 0 ? (
        <div style={{ padding: 64, textAlign: 'center', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
          <h3 style={{ color: '#1e293b', fontWeight: 700, margin: '0 0 8px' }}>No SLA trackers yet</h3>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>SLA trackers are created when T0 is confirmed on a task</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Task', 'SLA Config', 'T0 Date', 'Final Due', 'Current Phase', 'Status', 'Delay (days)'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trackers.map(tracker => {
                const sc = STATUS_COLORS[tracker.overallStatus] || STATUS_COLORS.not_started;
                return (
                  <tr key={tracker._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{tracker.task?.title || '—'}</div>
                      <div style={{ color: '#2563eb', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>{tracker.task?.taskNumber}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>{tracker.slaConfig?.name || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>
                      {tracker.t0Date ? new Date(tracker.t0Date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>
                      {tracker.finalDueDate ? new Date(tracker.finalDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>{tracker.currentPhaseName || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ ...sc, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                        {tracker.overallStatus?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: tracker.totalDelayDays > 0 ? '#dc2626' : '#16a34a', fontSize: 13, fontWeight: 700 }}>
                      {tracker.totalDelayDays > 0 ? `+${tracker.totalDelayDays}` : tracker.totalDelayDays || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default SLADashboard;
