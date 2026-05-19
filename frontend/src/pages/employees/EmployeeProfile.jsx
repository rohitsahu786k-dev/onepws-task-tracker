import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import employeeApi from '../../api/employee.api';
import useAuthStore from '../../store/authStore';
import EmployeeActivityTimeline from '../../components/employees/EmployeeActivityTimeline';
import EmployeeDocumentList from '../../components/employees/EmployeeDocumentList';
import EmployeeProfileHeader from '../../components/employees/EmployeeProfileHeader';
import EmployeeSkillTags from '../../components/employees/EmployeeSkillTags';
import EmployeeWorkloadSummary from '../../components/employees/EmployeeWorkloadSummary';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function EmployeeProfile() {
  const { id } = useParams();
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activity, setActivity] = useState([]);
  useEffect(() => {
    if (!workspaceId || !id) return;
    employeeApi.get(workspaceId, id).then((res) => setEmployee(res.data || res.employee));
    employeeApi.documents(workspaceId, id).then((res) => setDocuments(res.data || res.documents || []));
    employeeApi.workload(workspaceId, id).then((res) => setEmployee((current) => current ? { ...current, workloadSummary: res.data || res.workload } : current));
  }, [workspaceId, id]);
  if (!employee) return <main className="p-6">Loading...</main>;
  return (
    <main className="space-y-5 p-6">
      <EmployeeProfileHeader employee={employee} />
      <div className="flex gap-2"><Link to={`/employees/${id}/edit`} className="rounded-md border border-slate-200 px-3 py-2 text-sm">Edit Profile</Link></div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4"><h3 className="font-semibold">Skills</h3><div className="mt-3"><EmployeeSkillTags skills={employee.skills || []} /></div></div>
          <EmployeeDocumentList documents={documents} />
        </section>
        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4"><h3 className="font-semibold">Workload</h3><div className="mt-3"><EmployeeWorkloadSummary workload={employee.workloadSummary || {}} /></div></div>
          <EmployeeActivityTimeline activity={activity} />
        </aside>
      </div>
    </main>
  );
}
