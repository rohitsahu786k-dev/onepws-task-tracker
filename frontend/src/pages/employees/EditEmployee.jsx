import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import employeeApi from '../../api/employee.api';
import departmentApi from '../../api/department.api';
import designationApi from '../../api/designation.api';
import useAuthStore from '../../store/authStore';
import EmployeeForm from '../../components/employees/EmployeeForm';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [employee, setEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  useEffect(() => {
    if (!workspaceId || !id) return;
    employeeApi.get(workspaceId, id).then((res) => setEmployee(res.data || res.employee));
    departmentApi.list(workspaceId).then((res) => setDepartments(res.data || res.departments || []));
    designationApi.list(workspaceId).then((res) => setDesignations(res.data || res.designations || []));
  }, [workspaceId, id]);
  const submit = async (event) => {
    event.preventDefault();
    await employeeApi.update(workspaceId, id, { ...employee, department: employee.department?._id || employee.department, designation: employee.designation?._id || employee.designation });
    navigate(`/employees/${id}`);
  };
  if (!employee) return <main className="p-6">Loading...</main>;
  return <main className="space-y-4 p-6"><h1 className="text-2xl font-semibold">Edit Employee</h1><EmployeeForm value={{ ...employee, department: employee.department?._id || employee.department, designation: employee.designation?._id || employee.designation }} onChange={setEmployee} departments={departments} designations={designations} onSubmit={submit} /></main>;
}
