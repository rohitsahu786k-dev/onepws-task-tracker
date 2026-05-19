import React, { useEffect, useState } from 'react';
import employeeApi from '../../api/employee.api';
import useAuthStore from '../../store/authStore';
import OrgChartTree from '../../components/employees/OrgChartTree';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function OrgChart() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [nodes, setNodes] = useState([]);
  useEffect(() => { if (workspaceId) employeeApi.orgChart(workspaceId).then((res) => setNodes(res.data || [])); }, [workspaceId]);
  return <main className="space-y-5 p-6"><h1 className="text-2xl font-semibold">Org Chart</h1><OrgChartTree nodes={nodes} /></main>;
}
