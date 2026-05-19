import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: { bg: '#f1f5f9', color: '#64748b' },
  sent_for_signature: { bg: '#dbeafe', color: '#2563eb' },
  partially_signed: { bg: '#fef3c7', color: '#d97706' },
  signed: { bg: '#dcfce7', color: '#16a34a' },
  completed: { bg: '#d1fae5', color: '#059669' },
  cancelled: { bg: '#fef2f2', color: '#dc2626' },
  archived: { bg: '#f1f5f9', color: '#94a3b8' },
};

const MOMList = () => {
  const { workspace, user } = useAuthStore();
  const wid = workspace?._id || workspace?.id || user?.defaultWorkspace?._id || user?.defaultWorkspace;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', agenda: '', momType: 'general', meetingDate: '', venue: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['moms', wid, search, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/workspaces/${wid}/mom?${params}`);
      return data;
    },
    enabled: !!wid,
  });

  const createMOM = useMutation({
    mutationFn: (payload) => api.post(`/workspaces/${wid}/mom`, payload),
    onSuccess: () => {
      toast.success('MOM created!');
      queryClient.invalidateQueries({ queryKey: ['moms', wid] });
      setShowCreate(false);
      setForm({ title: '', agenda: '', momType: 'general', meetingDate: '', venue: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create MOM'),
  });

  const moms = data?.data || data?.moms || [];
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 };

  if (!wid) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>Select a workspace first</h1>
    </div>
  );

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Create MOM</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMOM.mutate(form); }} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Title *</label>
                <input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Weekly Marketing Review" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Agenda</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} placeholder="Meeting agenda..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={lbl}>MOM Type</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={form.momType} onChange={e => setForm({ ...form, momType: e.target.value })}>
                    {['general', 'project', 'task', 'vendor', 'client', 'internal'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Meeting Date</label>
                  <input type="datetime-local" style={{ ...inp, colorScheme: 'light' }} value={form.meetingDate} onChange={e => setForm({ ...form, meetingDate: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Venue</label>
                <input style={inp} value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Conference Room A" />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                <button type="submit" disabled={createMOM.isPending} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {createMOM.isPending ? 'Creating...' : 'Create MOM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Minutes of Meeting</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>{data?.pagination?.total || moms.length} total records</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search MOM..." style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', width: 200 }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
            <option value="">All Status</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Create MOM
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading MOMs...</div>
      ) : moms.length === 0 ? (
        <div style={{ padding: 64, textAlign: 'center', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3 style={{ color: '#1e293b', fontWeight: 700, margin: '0 0 8px' }}>No MOMs yet</h3>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 20px' }}>Create your first minutes of meeting</p>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + Create MOM
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['MOM #', 'Title', 'Type', 'Meeting Date', 'Status', 'Action Points', 'Created'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {moms.map(mom => {
                const sc = STATUS_COLORS[mom.status] || STATUS_COLORS.draft;
                return (
                  <tr key={mom._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#2563eb', fontWeight: 700 }}>{mom.momNumber}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b', maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mom.title}</div>
                      {mom.agenda && <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mom.agenda}</div>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{mom.momType}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>
                      {mom.meetingDate ? new Date(mom.meetingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ ...sc, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                        {mom.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>
                      {mom.actionPoints?.length || 0} points
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 12 }}>
                      {new Date(mom.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
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

export default MOMList;
