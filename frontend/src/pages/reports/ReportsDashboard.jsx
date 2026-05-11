import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Download, FileSpreadsheet, FileText, Mail, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as reportService from '../../services/report.service';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

const pickMetric = (summary, keys) => keys.map((key) => summary?.[key]).find((value) => value !== undefined && value !== null) ?? 0;

const ReportsDashboard = () => {
  const { workspace } = useAuthStore();
  const workspaceId = workspace?._id;
  const [reportType, setReportType] = useState('daily_tracker');
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', statuses: '', priorities: '' });

  const apiFilters = useMemo(() => ({
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    statuses: filters.statuses ? filters.statuses.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
    priorities: filters.priorities ? filters.priorities.split(',').map((item) => item.trim()).filter(Boolean) : undefined
  }), [filters]);

  const reportQuery = useQuery({
    queryKey: ['report-preview', workspaceId, reportType, apiFilters],
    queryFn: () => reportService.generateReportPreview(workspaceId, reportType, apiFilters),
    enabled: Boolean(workspaceId)
  });

  const report = reportQuery.data?.data;
  const summary = report?.summary || {};
  const chartData = report?.chartData || {};
  const rows = report?.rows || [];

  const primaryChart = chartData.tasksByStatus || chartData.slaStatusDistribution || chartData.departmentWiseRequests || chartData.recordsByStatus || [];
  const secondaryChart = chartData.onTimeVsDelayed || chartData.budgetUtilization || chartData.tasksByType || [];
  const trendData = chartData.monthlyTrend || chartData.monthlySlaComplianceTrend || chartData.monthlySpendingTrend || [];

  const handleExport = async (format) => {
    try {
      const res = await reportService.exportReport(workspaceId, reportType, format, apiFilters);
      const url = res.data?.downloadUrl || res.data?.fileUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      toast.success(`${format.toUpperCase()} report generated`);
      reportQuery.refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Export failed');
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Management, tracker, SLA, budget, department, and user performance reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => reportQuery.refetch()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
            <RefreshCw size={16} /> Preview
          </button>
          <ExportButton icon={FileText} label="PDF" onClick={() => handleExport('pdf')} />
          <ExportButton icon={FileSpreadsheet} label="Excel" onClick={() => handleExport('excel')} />
          <ExportButton icon={Download} label="CSV" onClick={() => handleExport('csv')} />
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-500 dark:border-slate-700" disabled>
            <Mail size={16} /> Email
          </button>
        </div>
      </div>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">Report Type</span>
          <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            {reportService.REPORT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <FilterInput label="Date From" type="date" value={filters.dateFrom} onChange={(value) => setFilters((prev) => ({ ...prev, dateFrom: value }))} />
        <FilterInput label="Date To" type="date" value={filters.dateTo} onChange={(value) => setFilters((prev) => ({ ...prev, dateTo: value }))} />
        <FilterInput label="Statuses" placeholder="open, closed" value={filters.statuses} onChange={(value) => setFilters((prev) => ({ ...prev, statuses: value }))} />
        <FilterInput label="Priorities" placeholder="high, urgent" value={filters.priorities} onChange={(value) => setFilters((prev) => ({ ...prev, priorities: value }))} />
      </section>

      {!workspaceId ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">Select a workspace to generate reports.</div>
      ) : reportQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">Loading report preview...</div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard title="Total" value={pickMetric(summary, ['totalTasks', 'total', 'totalRecords', 'totalSlaTasks', 'totalBudgets'])} />
            <MetricCard title="Completed" value={pickMetric(summary, ['completedTasks', 'completed', 'submittedTasks', 'totalCompletedWork'])} tone="green" />
            <MetricCard title="Pending" value={pickMetric(summary, ['pendingTasks', 'pending', 'pendingExpenses'])} tone="amber" />
            <MetricCard title="Delayed" value={pickMetric(summary, ['delayedTasks', 'delayed', 'breached'])} tone="red" />
            <MetricCard title="On-Time %" value={`${pickMetric(summary, ['onTimePercentage', 'slaComplianceRate', 'completionRate'])}%`} tone="blue" />
            <MetricCard title="Avg Delay" value={pickMetric(summary, ['averageDelayDays', 'averageDelay', 'averageSlaDelay'])} />
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <ChartPanel title="Primary Breakdown">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={primaryChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
            <ChartPanel title="Status Mix">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={secondaryChart} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                    {secondaryChart.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartPanel>
            <ChartPanel title="Monthly Trend">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="received" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="completed" stroke="#16a34a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          </section>

          <ReportTable rows={rows} />
        </>
      )}
    </main>
  );
};

const ExportButton = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">
    <Icon size={16} /> {label}
  </button>
);

const FilterInput = ({ label, value, onChange, type = 'text', placeholder }) => (
  <label className="space-y-1 text-sm">
    <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
    <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
  </label>
);

const MetricCard = ({ title, value, tone = 'slate' }) => {
  const tones = {
    slate: 'text-slate-950 dark:text-white',
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    blue: 'text-blue-600'
  };
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-medium uppercase text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
    </article>
  );
};

const ChartPanel = ({ title, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
    <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
    {children}
  </section>
);

const ReportTable = ({ rows }) => {
  const displayRows = rows.map((row) => {
    if (row.rowData || row.calculatedData) {
      return {
        serial_no: row.calculatedData?.serial_no || row.rowNumber,
        task_number: row.rowData?.task_number || row.task?.taskNumber,
        task_receipt_date: row.rowData?.task_receipt_date,
        task_handled_by: row.rowData?.task_handled_by_name || row.rowData?.task_handled_by,
        type_of_task: row.rowData?.type_of_task,
        target_due_date: row.calculatedData?.my_target_due_date,
        delay_in_time: row.calculatedData?.delay_in_time,
        final_status: row.rowData?.final_status || row.status
      };
    }
    return row;
  });
  const columns = Object.keys(displayRows[0] || {}).filter((key) => !key.startsWith('_')).slice(0, 8);
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Detailed Preview</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>{columns.map((column) => <th key={column} className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayRows.slice(0, 25).map((row, index) => (
              <tr key={row._id || index}>
                {columns.map((column) => <td key={column} className="max-w-xs truncate px-4 py-3 text-slate-700 dark:text-slate-300">{formatCell(row[column])}</td>)}
              </tr>
            ))}
            {!displayRows.length && <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={Math.max(columns.length, 1)}>No rows found for the selected filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
};

function formatCell(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(formatCell).join(', ');
  if (typeof value === 'object') return value.name || value.title || value.taskNumber || value.email || value._id || '';
  return String(value);
}

export default ReportsDashboard;
