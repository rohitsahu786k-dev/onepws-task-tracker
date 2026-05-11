import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import * as trackerService from '../../services/tracker.service';
import toast from 'react-hot-toast';

const FieldBuilder = () => {
  const { workspace } = useAuthStore();
  const queryClient = useQueryClient();
  const workspaceId = workspace?._id || 'mock-workspace-id';

  const { data: configData, isLoading } = useQuery({
    queryKey: ['trackerConfig', workspaceId],
    queryFn: () => trackerService.getTrackerConfig(workspaceId),
    enabled: !!workspaceId,
  });

  const updateConfigMutation = useMutation({
    mutationFn: (newFields) => trackerService.updateTrackerConfig(workspaceId, {
      configId: configData?.config?._id || configData?.data?._id,
      fields: newFields
    }),
    onSuccess: () => {
      toast.success('Fields updated successfully');
      queryClient.invalidateQueries(['trackerConfig', workspaceId]);
    },
    onError: () => toast.error('Failed to update fields')
  });

  // Local state for editing fields
  const [fields, setFields] = useState([]);
  
  // Sync when data loads
  useEffect(() => {
    const config = configData?.config || configData?.data;
    if (config?.fields) setFields(config.fields);
  }, [configData]);

  const handleAddField = () => {
    setFields([...fields, { fieldKey: '', label: '', fieldType: 'text', isRequired: false, isEditable: true, isVisible: true }]);
  };

  const handleSave = () => {
    // Validate empty names
    if (fields.some(f => !f.fieldKey || !f.label)) {
      toast.error('Field Key and Label are required');
      return;
    }
    updateConfigMutation.mutate(fields);
  };

  if (isLoading) return <div className="p-8">Loading Field Builder...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Field Builder</h1>
          <p className="text-sm text-slate-500">Configure the columns for the Daily Tracker.</p>
        </div>
        <div className="space-x-3">
          <button onClick={handleAddField} className="px-4 py-2 border rounded hover:bg-slate-50 text-sm font-medium">Add Column</button>
          <button onClick={handleSave} disabled={updateConfigMutation.isPending} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm font-medium">
            Save Changes
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg bg-white dark:bg-slate-950">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium text-slate-500">Label (Display Name)</label>
              <input 
                type="text" 
                value={field.label}
                onChange={e => {
                  const newFields = [...fields];
                  newFields[idx].label = e.target.value;
                  if(!field._id) {
                    newFields[idx].fieldKey = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                  }
                  setFields(newFields);
                }}
                className="w-full px-3 py-2 border rounded text-sm" 
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium text-slate-500">Database Name</label>
              <input 
                type="text" 
                value={field.fieldKey}
                readOnly={!!field._id} // don't allow renaming existing DB fields easily
                className="w-full px-3 py-2 border rounded text-sm bg-slate-50 text-slate-500" 
              />
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium text-slate-500">Type</label>
              <select 
                value={field.fieldType}
                onChange={e => {
                  const newFields = [...fields];
                  newFields[idx].fieldType = e.target.value;
                  setFields(newFields);
                }}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="dropdown">Dropdown</option>
                <option value="multi_select">Multi Select</option>
                <option value="checkbox">Checkbox</option>
                <option value="textarea">Textarea</option>
                <option value="user">User Reference</option>
                <option value="department">Department</option>
                <option value="status">Status</option>
                <option value="currency">Currency</option>
                <option value="percentage">Percentage</option>
                <option value="url">URL</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>

            <div className="pt-8">
              <button 
                onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {fields.length === 0 && (
          <div className="p-8 text-center border border-dashed rounded-lg text-slate-500">
            No custom fields configured yet. Click "Add Column" to begin.
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldBuilder;
