/**
 * CreateTaskModal.jsx - Complete Task Creation Component
 * Features: Form validation, file uploads, rich text editor, auto-calculations
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill.css';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, FileIcon, X } from 'lucide-react';

// ========== VALIDATION SCHEMA ==========
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title required').max(200, 'Max 200 characters'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project required'),
  stageId: z.string().min(1, 'Stage required'),
  assignedTo: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.date().optional(),
  estimatedHours: z.number().int().positive().optional(),
  slaDeliverableType: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const CreateTaskModal = ({ isOpen, onClose, workspaceId }) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [stages, setStages] = useState([]);
  const [members, setMembers] = useState([]);
  const [slaConfigs, setSLAConfigs] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  
  const queryClient = useQueryClient();
  
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: 'medium',
      assignedTo: [],
      tags: []
    }
  });

  const projectId = watch('projectId');

  // ========== FETCH DROPDOWN DATA ==========
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      try {
        // Fetch projects
        const projectsRes = await axios.get(
          `/api/workspaces/${workspaceId}/projects`
        );
        setProjects(projectsRes.data.data || []);

        // Fetch members
        const membersRes = await axios.get(
          `/api/workspaces/${workspaceId}/members`
        );
        setMembers(membersRes.data.data || []);

        // Fetch SLA configs
        const slaRes = await axios.get(
          `/api/workspaces/${workspaceId}/sla/config`
        );
        setSLAConfigs(slaRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err);
        toast.error('Failed to load form data');
      }
    };

    fetchData();
  }, [isOpen, workspaceId]);

  // ========== FETCH STAGES when project changes ==========
  useEffect(() => {
    if (!projectId) {
      setStages([]);
      return;
    }

    const fetchStages = async () => {
      try {
        const res = await axios.get(
          `/api/workspaces/${workspaceId}/projects/${projectId}/stages`
        );
        setStages(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch stages:', err);
      }
    };

    fetchStages();
  }, [projectId, workspaceId]);

  // ========== FILE UPLOAD HANDLING ==========
  const handleFileUpload = async (files) => {
    for (const file of files) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 50MB limit`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('temporary', 'true');

      try {
        const res = await axios.post(
          `/api/workspaces/${workspaceId}/tasks/attachments/temp`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`${file.name}: ${percent}%`);
            }
          }
        );

        setAttachments(prev => [
          ...prev,
          {
            id: res.data.data.tempFileId,
            name: file.name,
            size: file.size,
            type: file.type
          }
        ]);
        
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  // ========== DRAG & DROP ==========
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  // ========== FORM SUBMIT ==========
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        tempAttachments: attachments.map(a => a.id),
        dueDate: data.dueDate ? data.dueDate.toISOString() : null
      };

      const res = await axios.post(
        `/api/workspaces/${workspaceId}/tasks`,
        payload
      );

      toast.success('Task created successfully!');
      
      // Invalidate tasks list
      queryClient.invalidateQueries(['tasks']);
      
      // Close modal and reset form
      reset();
      setAttachments([]);
      onClose();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create task';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        
        {/* ========== HEADER ========== */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">+ Create Task</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* ========== FORM ========== */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* ========== ROW 1: Title & Priority ========== */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                placeholder="Enter task title"
                {...register('title')}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-blue-300'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* ========== ROW 2: Project & Stage ========== */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Project *
              </label>
              <select
                {...register('projectId')}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.projectId
                    ? 'border-red-500 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-blue-300'
                }`}
              >
                <option value="">Select project</option>
                {projects.map(proj => (
                  <option key={proj._id} value={proj._id}>
                    {proj.title}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-xs text-red-500">{errors.projectId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Stage *
              </label>
              <select
                {...register('stageId')}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.stageId
                    ? 'border-red-500 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-blue-300'
                }`}
              >
                <option value="">Select stage</option>
                {stages.map(stage => (
                  <option key={stage._id} value={stage._id}>
                    {stage.name}
                  </option>
                ))}
              </select>
              {errors.stageId && (
                <p className="mt-1 text-xs text-red-500">{errors.stageId.message}</p>
              )}
            </div>
          </div>

          {/* ========== Description (Rich Text) ========== */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <ReactQuill
                  value={field.value || ''}
                  onChange={field.onChange}
                  theme="snow"
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link']
                    ]
                  }}
                  className="h-32"
                />
              )}
            />
          </div>

          {/* ========== ROW 3: Assigned To & Due Date ========== */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Assigned To
              </label>
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    multiple
                    size={4}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {members.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                )}
              />
              <p className="mt-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                {...register('dueDate', {
                  setValueAs: (v) => v ? new Date(v) : undefined
                })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* ========== ROW 4: Est. Hours & SLA Type ========== */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                placeholder="0"
                {...register('estimatedHours', { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                SLA Deliverable Type
              </label>
              <select
                {...register('slaDeliverableType')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">None</option>
                {slaConfigs.map(config => (
                  <option key={config._id} value={config.deliverableType}>
                    {config.deliverableType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ========== Tags ========== */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tags
            </label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  placeholder="Enter tags separated by commas"
                  value={field.value?.join(', ') || ''}
                  onChange={(e) => field.onChange(e.target.value.split(',').map(t => t.trim()))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              )}
            />
          </div>

          {/* ========== FILE UPLOAD ========== */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <FileIcon className="mx-auto mb-2 text-slate-400" size={32} />
            <p className="text-sm font-semibold text-slate-700">Drag files here or click</p>
            <p className="text-xs text-slate-500">Max 50MB per file</p>
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(Array.from(e.target.files))}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-sm text-blue-600 hover:underline">Click to upload</span>
            </label>
          </div>

          {/* ========== ATTACHED FILES LIST ========== */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Attached Files</h4>
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <FileIcon size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="rounded p-1 hover:bg-slate-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ========== FOOTER ========== */}
          <div className="flex gap-4 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
