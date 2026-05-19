import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import employeeApi from '../../api/employee.api';
import departmentApi from '../../api/department.api';
import designationApi from '../../api/designation.api';
import useAuthStore from '../../store/authStore';
import EmployeeForm from '../../components/employees/EmployeeForm';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function CreateEmployee() {
  const navigate = useNavigate();
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [employee, setEmployee] = useState({ workspaceRole: 'member', employeeType: 'full_time' });
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!workspaceId) return;
    departmentApi.list(workspaceId).then((res) => setDepartments(res.data || res.departments || []));
    designationApi.list(workspaceId).then((res) => setDesignations(res.data || res.designations || []));
  }, [workspaceId]);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await employeeApi.create(workspaceId, employee);
      navigate(`/employees/${res.data?._id || res.employee?._id}`);
    } finally {
      setSaving(false);
    }
  };
  return <main className="space-y-4 p-6"><h1 className="text-2xl font-semibold">Add Employee</h1><EmployeeForm value={employee} onChange={setEmployee} departments={departments} designations={designations} onSubmit={submit} saving={saving} /></main>;
}
