const MeetingReminderSettings = ({ value = [1440, 30], onChange }) => {
  const setValue = (index, nextValue) => {
    const next = [...value];
    next[index] = Number(nextValue);
    onChange(next);
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      {value.map((minutes, index) => (
        <label key={index} className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Reminder {index + 1}</span>
          <input type="number" value={minutes} onChange={(event) => setValue(index, event.target.value)} className="w-full rounded-md border px-3 py-2" />
        </label>
      ))}
    </div>
  );
};

export default MeetingReminderSettings;
