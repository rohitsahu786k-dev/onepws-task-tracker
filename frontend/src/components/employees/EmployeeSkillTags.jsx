import React from 'react';

export default function EmployeeSkillTags({ skills = [] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.slice(0, 6).map((skill) => <span key={skill._id || skill.name} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{skill.name} {skill.level ? `• ${skill.level}` : ''}</span>)}
      {!skills.length && <span className="text-xs text-slate-400">No skills</span>}
    </div>
  );
}
