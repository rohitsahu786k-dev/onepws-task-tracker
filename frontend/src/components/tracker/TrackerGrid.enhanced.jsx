/**
 * TrackerGrid.jsx - Complete Tracker Grid with Inline Editing & Row Addition
 * Uses AG Grid for advanced table functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';

/**
 * AG Grid Cell Editors & Renderers
 */

// Date picker cell editor
const DateEditor = (props) => {
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <input
      ref={inputRef}
      type="date"
      value={props.value ? props.value.split('T')[0] : ''}
      onChange={(e) => props.onValueChange(e.target.value)}
      style={{ width: '100%', height: '32px', border: '1px solid #ccc' }}
    />
  );
};

// Text editor with debouncing
const TextEditor = (props) => {
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={props.value || ''}
      onChange={(e) => props.onValueChange(e.target.value)}
      style={{ width: '100%', height: '32px', border: '1px solid #ccc', padding: '4px' }}
    />
  );
};

// Number editor
const NumberEditor = (props) => {
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      type="number"
      value={props.value || ''}
      onChange={(e) => props.onValueChange(parseFloat(e.target.value) || null)}
      style={{ width: '100%', height: '32px', border: '1px solid #ccc', padding: '4px' }}
    />
  );
};

// Status color cell
const StatusRenderer = (props) => {
  const statusColors = {
    'On Time': '#4CAF50',
    'Delayed': '#FF5722',
    'Early': '#2196F3',
    'Pending': '#FFC107'
  };

  const color = statusColors[props.value] || '#999';
  return (
    <div
      style={{
        backgroundColor: color,
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 'bold'
      }}
    >
      {props.value || '-'}
    </div>
  );
};

/**
 * Main Grid Component
 */
export const TrackerGrid = ({ workspaceId, configId }) => {
  const gridRef = useRef();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // ========== COLUMN DEFINITIONS ==========
  const columnDefs = [
    {
      field: '_id',
      headerName: 'ID',
      width: 80,
      hide: true
    },
    {
      field: 'rowNumber',
      headerName: 'S.No',
      width: 60,
      editable: false,
      sort: 'asc'
    },
    {
      field: 'rowData.task_number',
      headerName: 'Task No.',
      width: 120,
      editable: false
    },
    {
      field: 'rowData.task_receipt_date',
      headerName: 'Receipt Date',
      width: 130,
      cellEditor: DateEditor,
      cellDataType: 'date'
    },
    {
      field: 'rowData.task_provided_by',
      headerName: 'Provided By',
      width: 150,
      cellEditor: TextEditor
    },
    {
      field: 'rowData.task_handled_by_name',
      headerName: 'Handled By',
      width: 150,
      cellEditor: TextEditor
    },
    {
      field: 'rowData.task_given_by_department_name',
      headerName: 'Department',
      width: 150,
      cellEditor: TextEditor
    },
    {
      field: 'rowData.type_of_task',
      headerName: 'Task Type',
      width: 150,
      cellEditor: TextEditor
    },
    {
      field: 'calculatedData.my_target_due_date',
      headerName: 'Target Due Date',
      width: 140,
      editable: false,
      cellDataType: 'date'
    },
    {
      field: 'rowData.actual_closing_date',
      headerName: 'Actual Close Date',
      width: 140,
      cellEditor: DateEditor,
      cellDataType: 'date'
    },
    {
      field: 'calculatedData.delay_in_task_closure',
      headerName: 'Delay (Days)',
      width: 120,
      editable: false,
      cellDataType: 'number'
    },
    {
      field: 'calculatedData.delay_status',
      headerName: 'Delay Status',
      width: 130,
      editable: false,
      cellRenderer: StatusRenderer
    },
    {
      field: 'rowData.remark_if_pending',
      headerName: 'Remarks',
      width: 200,
      cellEditor: TextEditor
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      editable: false,
      cellRenderer: (props) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => handleDeleteRow(props.data._id)}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Delete row"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  // ========== FETCH ROWS ==========
  useEffect(() => {
    fetchRows();
  }, [configId]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/workspaces/${workspaceId}/tracker/rows`,
        { params: { configId, limit: 100 } }
      );
      setRows(res.data.data.rows || []);
      setTotalRows(res.data.data.pagination.total);
    } catch (err) {
      toast.error('Failed to load tracker rows');
    } finally {
      setLoading(false);
    }
  };

  // ========== ADD NEW ROW ==========
  const handleAddRow = async () => {
    try {
      const emptyRow = {
        _id: `temp_${Date.now()}`,
        rowNumber: (Math.max(...rows.map(r => r.rowNumber), 0) || 0) + 1,
        rowData: {},
        calculatedData: {},
        isNew: true
      };

      // Optimistic update
      setRows(prev => [emptyRow, ...prev]);

      // API call
      const res = await axios.post(
        `/api/workspaces/${workspaceId}/tracker/rows`,
        {
          configId,
          rowData: {}
        }
      );

      // Replace temp row with real row
      setRows(prev =>
        prev.map(r =>
          r._id === emptyRow._id ? res.data.data : r
        )
      );

      // Focus first editable cell
      if (gridRef.current) {
        const api = gridRef.current.api;
        setTimeout(() => {
          api.setFocusedCell(0, 'rowData.task_receipt_date');
          api.startEditingCell({
            rowIndex: 0,
            colKey: 'rowData.task_receipt_date'
          });
        }, 100);
      }

      toast.success('New row added');
    } catch (err) {
      setRows(prev => prev.filter(r => r._id !== `temp_${Date.now()}`));
      toast.error('Failed to add row');
    }
  };

  // ========== DELETE ROW ==========
  const handleDeleteRow = async (rowId) => {
    if (!window.confirm('Delete this row?')) return;

    try {
      await axios.delete(
        `/api/workspaces/${workspaceId}/tracker/rows/${rowId}`
      );
      setRows(prev => prev.filter(r => r._id !== rowId));
      toast.success('Row deleted');
    } catch (err) {
      toast.error('Failed to delete row');
    }
  };

  // ========== ON CELL VALUE CHANGED (debounced) ==========
  const onCellValueChanged = async (params) => {
    const { data, colDef, newValue, oldValue } = params;

    if (newValue === oldValue) return;

    // Debounce API call (300ms)
    clearTimeout(debounceTimer);

    const timer = setTimeout(async () => {
      try {
        const fieldKey = colDef.field.replace('rowData.', '');

        const res = await axios.patch(
          `/api/workspaces/${workspaceId}/tracker/rows/${data._id}/field`,
          {
            fieldKey,
            value: newValue
          }
        );

        // Update row with recalculated data
        setRows(prev =>
          prev.map(r =>
            r._id === data._id ? res.data.data : r
          )
        );

        // Refresh grid to show calculated fields
        params.api.applyTransaction({ update: [res.data.data] });

      } catch (err) {
        toast.error('Failed to save field');
        // Revert cell value
        params.node.setDataValue(colDef.field, oldValue);
      }
    }, 300);

    setDebounceTimer(timer);
  };

  // ========== GRID CONFIGURATION ==========
  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    editable: true,
    cellDataType: false
  };

  return (
    <div className="w-full h-screen bg-white">
      {/* ========== TOOLBAR ========== */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Daily Tracker</h2>
        <button
          onClick={handleAddRow}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          + New Row
        </button>
      </div>

      {/* ========== GRID ========== */}
      <div className="ag-theme-quartz h-full" style={{ height: 'calc(100% - 70px)' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={50}
          onCellValueChanged={onCellValueChanged}
          animateRows={true}
          rowSelection="multiple"
          suppressClickEdit={false}
          editType="fullRow"
          stopEditingWhenGridLosesFocus={true}
          domLayout="autoHeight"
          enableCellChangeFlash={true}
          readOnlyEdit={false}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={20}
        />
      </div>
    </div>
  );
};

export default TrackerGrid;
