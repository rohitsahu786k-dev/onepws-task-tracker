import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import projectApi from '../../api/project.api';
import useAuthStore from '../../store/authStore';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

const ProjectDetail = () => {
  const { id } = useParams();
  const { workspace } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace);
  const [project, setProject] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    if (!workspaceId || !id) return;
    projectApi.get(workspaceId, id).then((res) => setProject(res.data || res.project));
    projectApi.dashboard(workspaceId, id).then((res) => setDashboard(res.data));
    projectApi.milestones(workspaceId, id).then((res) => setMilestones(res.data || []));
  }, [workspaceId, id]);

  if (!project) return <main className="p-6">Loading project...</main>;

  return (
    <main className="space-y-6 p-6">
      <header>
        <p className="text-sm text-slate-500">{project.projectNumber}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{project.title}</h1>
        <div className="mt-2 flex gap-2 text-sm">
          <span className="rounded bg-slate-100 px-2 py-1 capitalize">{project.status}</span>
          <span className="rounded bg-slate-100 px-2 py-1 capitalize">{project.priority}</span>
          <span className="rounded bg-slate-100 px-2 py-1">{project.progressPercent || 0}%</span>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        {['totalTasks', 'completedTasks', 'pendingTasks', 'delayedTasks'].map((key) => (
          <div key={key} className="rounded-md border bg-white p-4">
            <p className="text-xs uppercase text-slate-500">{key}</p>
            <p className="mt-2 text-2xl font-semibold">{dashboard?.taskSummary?.[key] || 0}</p>
          </div>
        ))}
      </section>
      <section className="rounded-md border bg-white p-4">
        <h2 className="font-semibold">Milestones</h2>
        <div className="mt-3 divide-y">
          {milestones.map((item) => (
            <div key={item._id} className="flex items-center justify-between py-3 text-sm">
              <span>{item.title}</span>
              <span className="capitalize text-slate-500">{item.status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default ProjectDetail;
