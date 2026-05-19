import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import employeeApi from '../../api/employee.api';
import departmentApi from '../../api/department.api';
import useAuthStore from '../../store/authStore';
import EmployeeCard from '../../components/employees/EmployeeCard';
import EmployeeFilterPanel from '../../components/employees/EmployeeFilterPanel';
import EmployeeTable from '../../components/employees/EmployeeTable';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function EmployeeDirectory() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({});
  const [view, setView] = useState('cards');

  useEffect(() => {
    if (!workspaceId) return;
    employeeApi.list(workspaceId, filters).then((res) => setEmployees(res.data || res.employees || []));
  }, [workspaceId, filters]);
  useEffect(() => {
    if (workspaceId) departmentApi.list(workspaceId).then((res) => setDepartments(res.data || res.departments || []));
  }, [workspaceId]);

  return (
    <main className="space-y-5 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-slate-900">Employee Directory</h1><p className="text-sm text-slate-600">People, departments, availability, skills and workload.</p></div>
        <div className="flex gap-2">
          <button onClick={() => setView(view === 'cards' ? 'table' : 'cards')} className="rounded-md border border-slate-200 px-3 py-2 text-sm">{view === 'cards' ? 'Table View' : 'Card View'}</button>
          <Link to="/employees/new" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">Add Employee</Link>
        </div>
      </header>
      <EmployeeFilterPanel filters={filters} onChange={setFilters} departments={departments} />
      {view === 'cards' ? <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{employees.map((employee) => <EmployeeCard key={employee._id} employee={employee} />)}</section> : <EmployeeTable employees={employees} />}
    </main>
  );
}
