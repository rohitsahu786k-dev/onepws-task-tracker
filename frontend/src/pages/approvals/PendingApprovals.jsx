import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', color: '#d97706' },
  approved: { bg: '#dcfce7', color: '#16a34a' },
  rejected: { bg: '#fef2f2', color: '#dc2626' },
  changes_requested: { bg: '#ede9fe', color: '#7c3aed' },
  cancelled: { bg: '#f1f5f9', color: '#94a3b8' },
};

const PendingApprovals = () => {
  const { workspace, user } = useAuthStore();
  const wid = workspace?._id || workspace?.id || user?.defaultWorkspace?._id || user?.defaultWorkspace;
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'general', requestedFrom: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['approvals', wid, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ workspace: wid });
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/workspaces/${wid}/approvals?${params}`);
      return data;
    },
    enabled: !!wid,
  });

  const createApproval = useMutation({
    mutationFn: (payload) => api.post(`/workspaces/${wid}/approvals`, payload),
    onSuccess: () => {
      toast.success('Approval request created!');
      queryClient.invalidateQueries({ queryKey: ['approvals', wid] });
      setShowCreate(false);
      setForm({ title: '', description: '', type: 'general', requestedFrom: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create approval'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/workspaces/${wid}/approvals/${id}`, { status }),
    onSuccess: () => {
      toast.success('Approval updated!');
      queryClient.invalidateQueries({ queryKey: ['approvals', wid] });
    },
    onError: () => toast.error('Failed to update approval'),
  });

  const approvals = data?.data || data?.approvals || [];
  const pending = approvals.filter(a => a.status === 'pending').length;
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 };

  if (!wid) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>✅</div>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>Select a workspace first</h1>
    </div>
  );

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto' }}>
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>New Approval Request</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createApproval.mutate(form); }} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Title *</label>
                <input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Approve Q2 marketing budget" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Description</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details for this approval..." />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Type</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {['general', 'budget', 'campaign', 'vendor', 'expense', 'content', 'print_job'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                <button type="submit" disabled={createApproval.isPending} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {createApproval.isPending ? 'Creating...' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Approvals</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>{pending} pending • {approvals.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
            <option value="">All Status</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + New Request
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading approvals...</div>
      ) : approvals.length === 0 ? (
        <div style={{ padding: 64, textAlign: 'center', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h3 style={{ color: '#1e293b', fontWeight: 700, margin: '0 0 8px' }}>No approval requests</h3>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 20px' }}>All clear! Create a new approval request if needed.</p>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + New Approval Request
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {approvals.map(approval => {
            const sc = STATUS_COLORS[approval.status] || STATUS_COLORS.pending;
            return (
              <div key={approval._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{approval.title}</div>
                  {approval.description && <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>{approval.description}</div>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{approval.type || 'general'}</span>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(approval.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ ...sc, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>
                    {approval.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                  {approval.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus.mutate({ id: approval._id, status: 'approved' })}
                        style={{ padding: '6px 14px', background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        ✓ Approve
                      </button>
                      <button onClick={() => updateStatus.mutate({ id: approval._id, status: 'rejected' })}
                        style={{ padding: '6px 14px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        ✕ Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default PendingApprovals;
