const MeetingConflictWarning = ({ conflicts = [], onContinue }) => {
  if (!conflicts.length) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Attendee conflict detected</p>
      <ul className="mt-2 space-y-1">
        {conflicts.map((conflict, index) => (
          <li key={`${conflict.userId}-${index}`}>{conflict.user} already has {conflict.meetingTitle} at this time.</li>
        ))}
      </ul>
      {onContinue && <button type="button" onClick={onContinue} className="mt-3 rounded-md bg-amber-600 px-3 py-2 text-white">Continue anyway</button>}
    </div>
  );
};

export default MeetingConflictWarning;
