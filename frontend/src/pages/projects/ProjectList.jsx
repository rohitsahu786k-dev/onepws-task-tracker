import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import projectApi from '../../api/project.api';
import useAuthStore from '../../store/authStore';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

const ProjectList = () => {
  const { workspace } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!workspaceId) return;
    projectApi.list(workspaceId, { search }).then((res) => setProjects(res.data || res.projects || []));
  }, [workspaceId, search]);

  return (
    <main className="space-y-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <Link to="/projects/new" className="rounded-md bg-primary px-4 py-2 text-sm text-white">New project</Link>
      </header>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects" className="w-full rounded-md border px-3 py-2" />
      <section className="overflow-hidden rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr><th className="p-3">Number</th><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3">Priority</th><th className="p-3">Progress</th></tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project._id} className="border-t">
                <td className="p-3">{project.projectNumber}</td>
                <td className="p-3"><Link className="text-primary" to={`/projects/${project._id}`}>{project.title}</Link></td>
                <td className="p-3 capitalize">{project.status}</td>
                <td className="p-3 capitalize">{project.priority}</td>
                <td className="p-3">{project.progressPercent || 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
};

export default ProjectList;
