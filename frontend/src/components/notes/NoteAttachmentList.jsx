const NoteAttachmentList = ({ attachments = [] }) => (
  <ul className="space-y-2">
    {attachments.map((item) => <li key={item._id || item.fileName} className="rounded border border-slate-200 px-3 py-2 text-sm">{item.fileName}</li>)}
  </ul>
);

export default NoteAttachmentList;
