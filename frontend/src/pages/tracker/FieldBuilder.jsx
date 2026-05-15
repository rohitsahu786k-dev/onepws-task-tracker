import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as trackerService from '../../services/tracker.service';

const FIELD_TYPES = [
  'text',
  'number',
  'date',
  'dropdown',
  'multi_select',
  'checkbox',
  'textarea',
  'user',
  'department',
  'file',
  'auto',
  'status',
  'currency',
  'percentage',
  'url',
  'email',
  'phone',
];

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;
const getConfig = (payload) => payload?.config || payload?.data || null;
const fieldIdOf = (field) => field.fieldId || field._id;

const emptyField = () => ({
  label: '',
  fieldType: 'text',
  isRequired: false,
  isEditable: true,
  isVisible: true,
  width: 180,
  defaultValue: '',
  placeholder: '',
  helpText: '',
  dropdownOptions: [],
  permissions: { viewRoles: ['admin', 'manager', 'member'], editRoles: ['admin', 'manager', 'member'], hideFromRoles: [] },
  lockRule: { lockAfterSubmit: false, lockForRoles: [] },
});

const parseOptions = (text) => text
  .split('\n')
  .map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    const [labelPart, valuePart] = trimmed.split('|').map((part) => part.trim());
    const label = labelPart || valuePart;
    const value = valuePart || label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return { label, value, order: index + 1, isActive: true };
  })
  .filter(Boolean);

const stringifyOptions = (options = []) => options
  .map((option) => `${option.label || option.value}|${option.value || option.label}`)
  .join('\n');

const Toggle = ({ label, checked, onChange, disabled }) => (
  <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
    <span className="font-medium text-slate-700">{label}</span>
    <input type="checkbox" checked={!!checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} className="h-4 w-4" />
  </label>
);

const FieldBuilder = () => {
  const { workspace } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyField);
  const [optionsText, setOptionsText] = useState('');

  const configQuery = useQuery({
    queryKey: ['trackerConfig', workspaceId],
    queryFn: () => trackerService.getTrackerConfig(workspaceId),
    enabled: !!workspaceId,
  });

  const config = getConfig(configQuery.data);
  const fields = useMemo(() => [...(config?.fields || [])].sort((a, b) => (a.order || 0) - (b.order || 0)), [config]);
  const selectedId = fieldIdOf(draft);
  const isExisting = !!selectedId;
  const isSystem = !!draft.isSystem;

  useEffect(() => {
    if (!draft.dropdownOptions?.length) {
      setOptionsText('');
    } else {
      setOptionsText(stringifyOptions(draft.dropdownOptions));
    }
  }, [selectedId]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['trackerConfig', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['trackerRows', workspaceId] });
  };

  const addFieldMutation = useMutation({
    mutationFn: (fieldData) => trackerService.addTrackerField(workspaceId, config._id, fieldData),
    onSuccess: () => {
      invalidate();
      setDraft(emptyField());
      toast.success('Field added');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Field add failed'),
  });

  const updateFieldMutation = useMutation({
    mutationFn: ({ fieldId, updateData }) => trackerService.updateTrackerField(workspaceId, config._id, fieldId, updateData),
    onSuccess: () => {
      invalidate();
      toast.success('Field updated');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Field update failed'),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId) => trackerService.deleteTrackerField(workspaceId, config._id, fieldId),
    onSuccess: () => {
      invalidate();
      setDraft(emptyField());
      toast.success('Field archived');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Field delete failed'),
  });

  const reorderMutation = useMutation({
    mutationFn: (nextFields) => trackerService.reorderTrackerFields(
      workspaceId,
      config._id,
      nextFields.map((field, index) => ({ fieldId: fieldIdOf(field), fieldKey: field.fieldKey, order: index + 1 }))
    ),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.response?.data?.message || 'Reorder failed'),
  });

  const updateDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const saveField = () => {
    if (!draft.label.trim()) return toast.error('Field label is required');
    if (!draft.fieldType) return toast.error('Field type is required');

    const payload = {
      ...draft,
      width: Number(draft.width) || 180,
      dropdownOptions: ['dropdown', 'multi_select', 'status'].includes(draft.fieldType) ? parseOptions(optionsText) : [],
    };

    if (isExisting) {
      updateFieldMutation.mutate({ fieldId: selectedId, updateData: payload });
    } else {
      addFieldMutation.mutate(payload);
    }
  };

  const moveField = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= fields.length) return;
    const next = [...fields];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    reorderMutation.mutate(next);
  };

  if (!workspaceId) {
    return (
      <main className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-950">Select a workspace first</h1>
        <p className="mt-2 text-sm text-slate-500">Tracker field configuration is workspace specific.</p>
      </main>
    );
  }

  if (configQuery.isLoading) return <main className="p-8 text-sm text-slate-500">Loading Field Builder...</main>;

  return (
    <main className="grid gap-4 xl:grid-cols-[minmax(320px,420px)_1fr]">
      <section className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-slate-950">Field Builder</h1>
          <p className="mt-1 text-sm text-slate-500">Add, edit, hide, reorder, validate, and lock Daily Tracker columns.</p>
        </header>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{isExisting ? 'Edit Field' : 'Add Field'}</h2>
            <button onClick={() => setDraft(emptyField())} className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <Plus size={14} /> New
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Field Label</span>
              <input
                value={draft.label || ''}
                onChange={(event) => updateDraft({ label: event.target.value })}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-primary"
                placeholder="Client Name"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Field Key</span>
                <input
                  value={draft.fieldKey || 'Auto generated'}
                  readOnly
                  className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Column Width</span>
                <input
                  type="number"
                  value={draft.width || 180}
                  onChange={(event) => updateDraft({ width: event.target.value })}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Field Type</span>
              <select
                value={draft.fieldType || 'text'}
                onChange={(event) => updateDraft({
                  fieldType: event.target.value,
                  isEditable: event.target.value === 'auto' ? false : draft.isEditable,
                })}
                disabled={isSystem}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>

            <div className="grid gap-2 sm:grid-cols-3">
              <Toggle label="Required" checked={draft.isRequired} disabled={isSystem} onChange={(value) => updateDraft({ isRequired: value })} />
              <Toggle label="Editable" checked={draft.isEditable} disabled={draft.fieldType === 'auto'} onChange={(value) => updateDraft({ isEditable: value })} />
              <Toggle label="Visible" checked={draft.isVisible !== false} onChange={(value) => updateDraft({ isVisible: value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Default Value</span>
                <input
                  value={draft.defaultValue || ''}
                  onChange={(event) => updateDraft({ defaultValue: event.target.value })}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Placeholder</span>
                <input
                  value={draft.placeholder || ''}
                  onChange={(event) => updateDraft({ placeholder: event.target.value })}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Help Text</span>
              <textarea
                value={draft.helpText || ''}
                onChange={(event) => updateDraft({ helpText: event.target.value })}
                rows={2}
                className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            {['dropdown', 'multi_select', 'status'].includes(draft.fieldType) ? (
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Dropdown Options</span>
                <textarea
                  value={optionsText}
                  onChange={(event) => setOptionsText(event.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-primary"
                  placeholder="CD|cd&#10;CCR|ccr&#10;MOT|mot"
                />
              </label>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Edit Roles</span>
                <input
                  value={(draft.permissions?.editRoles || []).join(',')}
                  onChange={(event) => updateDraft({
                    permissions: { ...(draft.permissions || {}), editRoles: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) },
                  })}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Hide From Roles</span>
                <input
                  value={(draft.permissions?.hideFromRoles || []).join(',')}
                  onChange={(event) => updateDraft({
                    permissions: { ...(draft.permissions || {}), hideFromRoles: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) },
                  })}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                />
              </label>
            </div>

            <Toggle
              label="Lock after final submit"
              checked={draft.lockRule?.lockAfterSubmit}
              onChange={(value) => updateDraft({ lockRule: { ...(draft.lockRule || {}), lockAfterSubmit: value } })}
            />

            <button
              onClick={saveField}
              disabled={addFieldMutation.isPending || updateFieldMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              <Save size={16} /> Save Field
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{config?.name || 'Marketing Daily Task Tracker'}</h2>
            <p className="mt-1 text-xs text-slate-500">{fields.filter((field) => !field.isDeleted).length} configured columns</p>
          </div>
          <Settings2 className="text-slate-400" size={18} />
        </div>

        <div className="divide-y divide-slate-100">
          {fields.map((field, index) => {
            const id = fieldIdOf(field);
            const active = id === selectedId;
            return (
              <article
                key={id || field.fieldKey}
                className={`grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto] ${active ? 'bg-blue-50/60' : ''} ${field.isDeleted ? 'opacity-50' : ''}`}
              >
                <button type="button" onClick={() => setDraft({ ...emptyField(), ...field })} className="min-w-0 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{field.label}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{field.fieldType}</span>
                    {field.isSystem ? <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">system</span> : null}
                    {field.isRequired ? <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">required</span> : null}
                    {field.isVisible === false ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-400" />}
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-slate-500">{field.fieldKey}</p>
                </button>

                <div className="flex items-center gap-1">
                  <button onClick={() => moveField(index, -1)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50" title="Move up">
                    <ArrowUp size={14} />
                  </button>
                  <button onClick={() => moveField(index, 1)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50" title="Move down">
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => deleteFieldMutation.mutate(id)}
                    disabled={field.isSystem}
                    className="grid h-8 w-8 place-items-center rounded-md border border-red-100 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Archive field"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })}

          {!fields.length ? (
            <div className="p-8 text-center text-sm text-slate-500">No fields configured yet.</div>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export default FieldBuilder;
