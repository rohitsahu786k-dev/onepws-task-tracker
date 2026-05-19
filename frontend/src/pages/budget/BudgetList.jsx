import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: { bg: '#f1f5f9', color: '#64748b' },
  pending_approval: { bg: '#fef3c7', color: '#d97706' },
  active: { bg: '#dcfce7', color: '#16a34a' },
  rejected: { bg: '#fef2f2', color: '#dc2626' },
  closed: { bg: '#f1f5f9', color: '#94a3b8' },
  archived: { bg: '#e0e7ff', color: '#7c3aed' },
  on_hold: { bg: '#f0fdf4', color: '#15803d' },
};

const TYPE_ICONS = { project: '📁', department: '🏢', campaign: '📣', general: '📊', annual: '📅' };

const StatCard = ({ label, value, color, icon }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 44, height: 44, borderRadius: 11, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
    <div>
      <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</p>
      <p style={{ color: '#0f172a', fontSize: 24, fontWeight: 800, margin: '2px 0 0' }}>{value ?? 0}</p>
    </div>
  </div>
);

const BudgetList = () => {
  const { workspace, user } = useAuthStore();
  const wid = workspace?._id || workspace?.id || user?.defaultWorkspace?._id || user?.defaultWorkspace;
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', budgetType: 'project', totalAmount: '', currency: 'INR',
    fiscalYear: new Date().getFullYear(), description: '', startDate: '', endDate: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['budgets', wid, filterStatus, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('budgetType', filterType);
      const { data } = await api.get(`/workspaces/${wid}/budgets?${params}`);
      return data;
    },
    enabled: !!wid,
  });

  const { data: dashData } = useQuery({
    queryKey: ['budget-dashboard', wid],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${wid}/budgets/dashboard`);
      return data?.data;
    },
    enabled: !!wid,
  });

  const createBudget = useMutation({
    mutationFn: (payload) => api.post(`/workspaces/${wid}/budgets`, payload),
    onSuccess: () => {
      toast.success('Budget created!');
      queryClient.invalidateQueries({ queryKey: ['budgets', wid] });
      setShowCreate(false);
      setForm({ title: '', budgetType: 'project', totalAmount: '', currency: 'INR', fiscalYear: new Date().getFullYear(), description: '', startDate: '', endDate: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create budget'),
  });

  const budgets = data?.data || data?.budgets || [];
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 };

  const fmt = (num, currency = 'INR') => {
    if (!num && num !== 0) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(num);
  };

  if (!wid) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>💰</div>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>Select a workspace first</h1>
    </div>
  );

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto' }}>
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Create Budget</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createBudget.mutate({ ...form, totalAmount: Number(form.totalAmount), fiscalYear: Number(form.fiscalYear) }); }} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Budget Title *</label>
                <input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Q3 Marketing Budget" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={lbl}>Type</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={form.budgetType} onChange={e => setForm({ ...form, budgetType: e.target.value })}>
                    {['project', 'department', 'campaign', 'general', 'annual'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Currency</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                    {['INR', 'USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Total Amount *</label>
                  <input type="number" min="0" style={inp} value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} placeholder="0" required />
                </div>
                <div>
                  <label style={lbl}>Fiscal Year</label>
                  <input type="number" style={inp} value={form.fiscalYear} onChange={e => setForm({ ...form, fiscalYear: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Start Date</label>
                  <input type="date" style={{ ...inp, colorScheme: 'light' }} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>End Date</label>
                  <input type="date" style={{ ...inp, colorScheme: 'light' }} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Description</label>
                <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Budget details..." />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                <button type="submit" disabled={createBudget.isPending} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {createBudget.isPending ? 'Creating...' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Budgets</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>{budgets.length} budgets</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
            <option value="">All Status</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
            <option value="">All Types</option>
            {['project', 'department', 'campaign', 'general', 'annual'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Create Budget
          </button>
        </div>
      </div>

      {/* Stats */}
      {dashData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Budgeted" value={fmt(dashData.totalBudgeted)} color="#2563eb" icon="💰" />
          <StatCard label="Total Spent" value={fmt(dashData.totalSpent)} color="#dc2626" icon="💸" />
          <StatCard label="Remaining" value={fmt(dashData.remaining)} color="#16a34a" icon="💵" />
          <StatCard label="Active" value={dashData.activeBudgets} color="#7c3aed" icon="📊" />
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div style={{ padding: 64, textAlign: 'center', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
          <h3 style={{ color: '#1e293b', fontWeight: 700, margin: '0 0 8px' }}>No budgets yet</h3>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 20px' }}>Create your first budget to track spending</p>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + Create Budget
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Budget #', 'Title', 'Type', 'Total Amount', 'Spent', 'Remaining', 'Status', 'Period'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {budgets.map(budget => {
                const sc = STATUS_COLORS[budget.status] || STATUS_COLORS.draft;
                const spent = budget.utilization?.totalSpent || 0;
                const remaining = (budget.totalAmount || 0) - spent;
                const pct = budget.totalAmount ? Math.round((spent / budget.totalAmount) * 100) : 0;
                return (
                  <tr key={budget._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#2563eb', fontWeight: 700 }}>{budget.budgetNumber}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{budget.title}</div>
                      {budget.description && <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{budget.description?.slice(0, 60)}{budget.description?.length > 60 ? '...' : ''}</div>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 18 }}>{TYPE_ICONS[budget.budgetType] || '📊'}</span>
                      <span style={{ color: '#64748b', fontSize: 12, marginLeft: 6 }}>{budget.budgetType}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{fmt(budget.totalAmount, budget.currency)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: pct > 90 ? '#dc2626' : pct > 70 ? '#d97706' : '#64748b', fontWeight: 600, fontSize: 14 }}>{fmt(spent, budget.currency)}</div>
                      <div style={{ marginTop: 4, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct > 90 ? '#dc2626' : pct > 70 ? '#d97706' : '#16a34a', borderRadius: 2, transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>{pct}% used</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: remaining < 0 ? '#dc2626' : '#16a34a', fontWeight: 700, fontSize: 14 }}>{fmt(remaining, budget.currency)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ ...sc, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                        {budget.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 12 }}>
                      FY {budget.fiscalYear}
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

export default BudgetList;
