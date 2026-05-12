import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { Link } from 'react-router-dom';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import useAuthStore from '../../store/authStore';
import * as trackerService from '../../services/tracker.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const DailyTracker = () => {
  const { workspace } = useAuthStore();
  const queryClient = useQueryClient();
  const workspaceId = workspace?._id || workspace?.id || workspace;

  const { data: configData, isLoading: isConfigLoading } = useQuery({
    queryKey: ['trackerConfig', workspaceId],
    queryFn: () => trackerService.getTrackerConfig(workspaceId),
    enabled: !!workspaceId,
  });

  const { data: rowsData, isLoading: isRowsLoading } = useQuery({
    queryKey: ['trackerRows', workspaceId],
    queryFn: () => trackerService.getTrackerRows(workspaceId),
    enabled: !!workspaceId,
  });

  const updateRowMutation = useMutation({
    mutationFn: ({ rowId, fieldKey, value }) => trackerService.updateTrackerCell(workspaceId, rowId, fieldKey, value),
    onSuccess: () => {
      toast.success('Row updated successfully');
      queryClient.invalidateQueries({ queryKey: ['trackerRows', workspaceId] });
    },
    onError: () => toast.error('Failed to update row')
  });

  const createRowMutation = useMutation({
    mutationFn: () => trackerService.addTrackerRow(workspaceId, {
      configId: configData?.config?._id || configData?.data?._id,
      rowData: {}
    }),
    onSuccess: () => {
      toast.success('New tracker row created');
      queryClient.invalidateQueries({ queryKey: ['trackerRows', workspaceId] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create row')
  });

  const fields = useMemo(() => {
    const config = configData?.config || configData?.data;
    return (config?.fields || [])
      .filter((field) => field.isVisible !== false && !field.isDeleted)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [configData]);

  const rows = useMemo(() => rowsData?.rows || rowsData?.data || [], [rowsData]);

  const columnDefs = useMemo(() => {
    return fields.map(field => {
      const isAuto = field.fieldType === 'auto';
      const colDef = {
        colId: field.fieldKey,
        headerName: field.label,
        width: field.width || (isAuto ? 150 : 180),
        pinned: ['serial_no', 'task_number'].includes(field.fieldKey) ? 'left' : undefined,
        editable: !isAuto && field.isEditable !== false,
        valueGetter: (params) => {
          const source = isAuto ? params.data.calculatedData : params.data.rowData;
          return source?.[field.fieldKey] ?? '';
        },
        valueSetter: (params) => {
          params.data.rowData = {
            ...(params.data.rowData || {}),
            [field.fieldKey]: params.newValue
          };
          return true;
        },
        cellClassRules: field.fieldKey === 'delay_in_time' ? {
          'text-green-700 bg-green-50': (params) => String(params.value).includes('On Time'),
          'text-red-700 bg-red-50': (params) => String(params.value).includes('Delayed'),
          'text-yellow-700 bg-yellow-50': (params) => String(params.value).includes('Pending'),
          'text-blue-700 bg-blue-50': (params) => String(params.value).includes('Early'),
        } : undefined,
      };

      if (['dropdown', 'status'].includes(field.fieldType) && field.dropdownOptions?.length) {
        colDef.cellEditor = 'agSelectCellEditor';
        colDef.cellEditorParams = {
          values: field.dropdownOptions
            .filter((option) => option.isActive !== false)
            .map((option) => option.value)
        };
      }

      if (field.fieldType === 'date') {
        colDef.valueFormatter = (params) => {
          if (!params.value) return '';
          try { return format(new Date(params.value), 'dd MMM yyyy'); } catch { return params.value; }
        };
      }

      return colDef;
    });
  }, [fields]);

  const onCellValueChanged = (event) => {
    // Determine what field changed and send payload
    const { data, colDef, newValue, oldValue } = event;
    if (newValue === oldValue) return;
    
    const fieldKey = colDef.colId;
    updateRowMutation.mutate({ rowId: data._id, fieldKey, value: newValue });
  };

  const onGridReady = (params) => {
    params.api.sizeColumnsToFit();
  };

  if (!workspaceId) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-950">
        <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Select a workspace to use Daily Tracker</h1>
        <p className="mt-2 text-sm text-slate-500">Tracker rows and field configuration are isolated per workspace.</p>
        <Link to="/workspaces/new" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          Create workspace
        </Link>
      </div>
    );
  }

  if (isConfigLoading || isRowsLoading) return <div className="p-8">Loading Tracker...</div>;

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Daily Tracker</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 text-sm font-medium">
            Export Excel
          </button>
          <button
            onClick={() => createRowMutation.mutate()}
            disabled={createRowMutation.isPending}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm font-medium disabled:opacity-70"
          >
            + New Task Row
          </button>
        </div>
      </div>

      <div className="flex-1 ag-theme-alpine dark:ag-theme-alpine-dark border rounded-lg overflow-hidden">
        <AgGridReact
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
            minWidth: 100,
          }}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          animateRows={true}
          rowSelection="multiple"
          stopEditingWhenCellsLoseFocus={true}
        />
      </div>
    </div>
  );
};

export default DailyTracker;
