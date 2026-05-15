import { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Download,
  FileSpreadsheet,
  Filter,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import useAuthStore from '../../store/authStore';
import * as trackerService from '../../services/tracker.service';

ModuleRegistry.registerModules([AllCommunityModule]);

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;
const getConfig = (payload) => payload?.config || payload?.data || null;
const getRows = (payload) => payload?.rows || payload?.data || [];
const getSummary = (payload) => payload?.summary || payload?.data || {};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return format(new Date(value), 'dd MMM yyyy');
  } catch {
    return value;
  }
};

const optionLabel = (field, value) => {
  const match = field.dropdownOptions?.find((option) => option.value === value);
  return match?.label || value || '';
};

const statusTone = (value) => {
  const text = String(value || '').toLowerCase();
  if (text.includes('delayed')) return 'bg-red-50 text-red-700 border-red-200';
  if (text.includes('submitted') || text.includes('closed') || text.includes('on time')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (text.includes('early')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (text.includes('hold') || text.includes('cancelled')) return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const PillRenderer = ({ value }) => (
  <span className={`inline-flex max-w-full items-center rounded border px-2 py-0.5 text-xs font-medium ${statusTone(value)}`}>
    <span className="truncate">{value || 'Pending'}</span>
  </span>
);

const Metric = ({ label, value, helper }) => (
  <div className="min-w-0 rounded-md border border-slate-200 bg-white px-4 py-3">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-slate-950">{value ?? 0}</p>
    {helper ? <p className="mt-1 truncate text-xs text-slate-500">{helper}</p> : null}
  </div>
);

const DailyTracker = () => {
  const { workspace } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const gridRef = useRef(null);
  const [filters, setFilters] = useState({ search: '', final_status: '', delay_status: '' });
  const [selectedRows, setSelectedRows] = useState([]);

  const configQuery = useQuery({
    queryKey: ['trackerConfig', workspaceId],
    queryFn: () => trackerService.getTrackerConfig(workspaceId),
    enabled: !!workspaceId,
  });

  const rowsQuery = useQuery({
    queryKey: ['trackerRows', workspaceId, filters],
    queryFn: () => trackerService.getTrackerRows(workspaceId, filters),
    enabled: !!workspaceId,
  });

  const summaryQuery = useQuery({
    queryKey: ['trackerSummary', workspaceId, filters],
    queryFn: () => trackerService.getTrackerSummary(workspaceId, filters),
    enabled: !!workspaceId,
  });

  const config = getConfig(configQuery.data);
  const fields = useMemo(() => {
    return [...(config?.fields || [])]
      .filter((field) => field.isVisible !== false && !field.isDeleted)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [config]);

  const rows = useMemo(() => getRows(rowsQuery.data), [rowsQuery.data]);
  const summary = getSummary(summaryQuery.data);

  const invalidateTracker = () => {
    queryClient.invalidateQueries({ queryKey: ['trackerRows', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['trackerSummary', workspaceId] });
  };

  const createRowMutation = useMutation({
    mutationFn: () => trackerService.addTrackerRow(workspaceId, { configId: config?._id, rowData: {} }),
    onSuccess: invalidateTracker,
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create row'),
  });

  const updateCellMutation = useMutation({
    mutationFn: ({ rowId, fieldKey, value }) => trackerService.updateTrackerCell(workspaceId, rowId, fieldKey, value),
    onSuccess: invalidateTracker,
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Cell update failed');
      rowsQuery.refetch();
    },
  });

  const deleteRowMutation = useMutation({
    mutationFn: (rowId) => trackerService.deleteTrackerRow(workspaceId, rowId),
    onSuccess: () => {
      setSelectedRows([]);
      invalidateTracker();
      toast.success('Row moved to trash');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Delete failed'),
  });

  const importMutation = useMutation({
    mutationFn: (file) => trackerService.importTrackerRows(workspaceId, file),
    onSuccess: (data) => {
      invalidateTracker();
      const log = data.importLog || data.data;
      toast.success(`Imported ${log?.successRows || 0} rows, ${log?.failedRows || 0} failed`);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Import failed'),
  });

  const exportMutation = useMutation({
    mutationFn: (type) => type === 'pdf'
      ? trackerService.exportTrackerPdf(workspaceId, filters)
      : trackerService.exportTrackerExcel(workspaceId, filters),
    onError: (error) => toast.error(error.response?.data?.message || 'Export failed'),
  });

  const templateMutation = useMutation({
    mutationFn: () => trackerService.downloadTrackerTemplate(workspaceId),
    onError: (error) => toast.error(error.response?.data?.message || 'Template download failed'),
  });

  const columnDefs = useMemo(() => fields.map((field) => {
    const isAuto = field.fieldType === 'auto';
    const isStatus = field.fieldType === 'status' || field.fieldKey === 'final_status' || field.fieldKey === 'delay_in_time';

    const colDef = {
      colId: field.fieldKey,
      headerName: field.label,
      width: field.width || (isAuto ? 150 : 180),
      minWidth: field.fieldKey === 'serial_no' ? 90 : 130,
      pinned: ['serial_no', 'task_number'].includes(field.fieldKey) ? 'left' : undefined,
      lockPinned: ['serial_no', 'task_number'].includes(field.fieldKey),
      editable: !isAuto && field.isEditable !== false,
      valueGetter: (params) => {
        const source = isAuto ? params.data?.calculatedData : params.data?.rowData;
        return source?.[field.fieldKey] ?? '';
      },
      valueSetter: (params) => {
        params.data.rowData = { ...(params.data.rowData || {}), [field.fieldKey]: params.newValue };
        return true;
      },
      tooltipValueGetter: (params) => optionLabel(field, params.value),
    };

    if (['dropdown', 'status', 'multi_select'].includes(field.fieldType) && field.dropdownOptions?.length) {
      colDef.cellEditor = 'agSelectCellEditor';
      colDef.cellEditorParams = {
        values: field.dropdownOptions.filter((option) => option.isActive !== false).map((option) => option.value),
      };
      colDef.valueFormatter = (params) => optionLabel(field, params.value);
    }

    if (field.fieldType === 'date') {
      colDef.cellEditor = 'agDateStringCellEditor';
      colDef.valueFormatter = (params) => formatDate(params.value);
    }

    if (['number', 'currency', 'percentage'].includes(field.fieldType)) {
      colDef.cellEditor = 'agNumberCellEditor';
    }

    if (field.fieldType === 'checkbox') {
      colDef.cellRenderer = 'agCheckboxCellRenderer';
      colDef.cellEditor = 'agCheckboxCellEditor';
    }

    if (isStatus) {
      colDef.cellRenderer = PillRenderer;
      colDef.cellClass = 'flex items-center';
    }

    return colDef;
  }), [fields]);

  const onCellValueChanged = (event) => {
    const { data, colDef, newValue, oldValue } = event;
    if (!data?._id || newValue === oldValue) return;
    updateCellMutation.mutate({ rowId: data._id, fieldKey: colDef.colId, value: newValue });
  };

  const selectedRow = selectedRows[0];

  const submitSelected = () => {
    if (!selectedRow?._id) return toast.error('Select one row first');
    updateCellMutation.mutate({ rowId: selectedRow._id, fieldKey: 'final_status', value: 'submitted' });
  };

  const deleteSelected = () => {
    if (!selectedRow?._id) return toast.error('Select one row first');
    deleteRowMutation.mutate(selectedRow._id);
  };

  const onImportFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) importMutation.mutate(file);
  };

  if (!workspaceId) {
    return (
      <main className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-950">Select a workspace to use Daily Tracker</h1>
        <p className="mt-2 text-sm text-slate-500">Tracker rows and field configuration are isolated per workspace.</p>
        <Link to="/workspaces/new" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          Create workspace
        </Link>
      </main>
    );
  }

  const isLoading = configQuery.isLoading || rowsQuery.isLoading;

  return (
    <main className="flex h-full min-h-[calc(100vh-8rem)] flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Daily Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">Dynamic marketing task sheet with backend formulas, lock rules, import/export, and reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/settings/field-builder" className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Settings size={16} /> Field Builder
          </Link>
          <button onClick={() => templateMutation.mutate()} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download size={16} /> Template
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Upload size={16} /> Import
          </button>
          <button onClick={() => exportMutation.mutate('excel')} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <FileSpreadsheet size={16} /> Export
          </button>
          <button
            onClick={() => createRowMutation.mutate()}
            disabled={createRowMutation.isPending || !config?._id}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            <Plus size={16} /> Add Row
          </button>
        </div>
      </header>

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportFile} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Total" value={summary.totalTasks} helper="Rows in current view" />
        <Metric label="Pending" value={summary.pendingTasks} helper="Open work" />
        <Metric label="Submitted" value={summary.submittedTasks} helper="Locked after submit" />
        <Metric label="Delayed" value={summary.delayedTasks} helper={`${summary.averageDelay || 0} avg days`} />
        <Metric label="On-Time" value={`${summary.onTimePercentage || 0}%`} helper="Early counted as on-time" />
        <Metric label="Due" value={summary.tasksDueToday} helper={`${summary.tasksDueTomorrow || 0} due tomorrow`} />
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search task number, type, remarks"
            className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filters.final_status}
          onChange={(event) => setFilters((prev) => ({ ...prev, final_status: event.target.value }))}
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="closed">Closed</option>
          <option value="hold">Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filters.delay_status}
          onChange={(event) => setFilters((prev) => ({ ...prev, delay_status: event.target.value }))}
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">Delay status</option>
          <option value="Pending">Pending</option>
          <option value="On Time">On Time</option>
          <option value="Delayed">Delayed</option>
          <option value="Early">Early</option>
        </select>
        <button onClick={() => rowsQuery.refetch()} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <RefreshCw size={16} /> Refresh
        </button>
        <button onClick={submitSelected} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Lock size={16} /> Submit
        </button>
        <button onClick={deleteSelected} className="h-9 rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50">
          Delete
        </button>
        <div className="ml-auto inline-flex items-center gap-2 text-xs text-slate-500">
          <Filter size={14} /> {rows.length} rows
        </div>
      </section>

      <section className="min-h-[520px] flex-1 overflow-hidden rounded-md border border-slate-200 bg-white">
        {isLoading ? (
          <div className="grid h-full min-h-[520px] place-items-center text-sm text-slate-500">Loading tracker...</div>
        ) : fields.length ? (
          <div className="ag-theme-alpine h-full min-h-[520px] w-full">
            <AgGridReact
              ref={gridRef}
              rowData={rows}
              columnDefs={columnDefs}
              defaultColDef={{
                resizable: true,
                sortable: true,
                filter: true,
                minWidth: 110,
                wrapHeaderText: true,
                autoHeaderHeight: true,
              }}
              onCellValueChanged={onCellValueChanged}
              onSelectionChanged={(event) => setSelectedRows(event.api.getSelectedRows())}
              animateRows
              rowSelection="multiple"
              undoRedoCellEditing
              enableCellTextSelection
              stopEditingWhenCellsLoseFocus
              tooltipShowDelay={250}
            />
          </div>
        ) : (
          <div className="grid h-full min-h-[520px] place-items-center text-center">
            <div>
              <p className="text-sm font-medium text-slate-900">No tracker fields configured</p>
              <Link to="/settings/field-builder" className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
                Open Field Builder
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default DailyTracker;
