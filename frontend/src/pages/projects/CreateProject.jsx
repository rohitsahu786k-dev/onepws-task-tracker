import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import projectApi from '../../api/project.api';
import useAuthStore from '../../store/authStore';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

const CreateProject = () => {
  const navigate = useNavigate();
  const { workspace } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace);
  const [form, setForm] = useState({ title: '', projectType: 'other', priority: 'medium', startDate: '', dueDate: '', description: '', estimatedBudget: '' });

  const submit = async (event) => {
    event.preventDefault();
    if (!workspaceId) return toast.error('Select a workspace first');
    try {
      const res = await projectApi.create(workspaceId, { ...form, estimatedBudget: Number(form.estimatedBudget || 0) });
      toast.success('Project created');
      navigate(`/projects/${res.data?._id || res.project?._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Project creation failed');
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <form onSubmit={submit} className="space-y-5">
        <h1 className="text-2xl font-semibold text-slate-900">Create Project</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <input required placeholder="Project title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="rounded-md border px-3 py-2 md:col-span-2" />
          <select value={form.projectType} onChange={(e) => setForm((prev) => ({ ...prev, projectType: e.target.value }))} className="rounded-md border px-3 py-2">
            {['catalogue', 'brochure', 'social_media_campaign', 'email_campaign', 'website_update', 'event', 'product_launch', 'branding', 'print', 'video', 'presentation', 'other'].map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
          </select>
          <select value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))} className="rounded-md border px-3 py-2">
            {['low', 'medium', 'high', 'urgent'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
          <input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} className="rounded-md border px-3 py-2" />
          <input type="date" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="rounded-md border px-3 py-2" />
          <input type="number" placeholder="Estimated budget" value={form.estimatedBudget} onChange={(e) => setForm((prev) => ({ ...prev, estimatedBudget: e.target.value }))} className="rounded-md border px-3 py-2" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="rounded-md border px-3 py-2 md:col-span-2" />
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-white">Create project</button>
      </form>
    </main>
  );
};

export default CreateProject;
